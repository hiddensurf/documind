"""
Multi-Model CAD Visual Analyzer
Supports both Gemini and OpenRouter models
"""

import os
import time
import base64
import httpx
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from google import genai
from google.genai import types
from PIL import Image, ImageEnhance, ImageFilter
from io import BytesIO

class MultiModelCADAnalyzer:
    """Analyze CAD drawings with multiple AI models"""
    
    # Available models
    MODELS = {
        # Gemini models (existing)
        'gemini-2.5-flash': {
            'name': 'Gemini 2.5 Flash',
            'provider': 'gemini',
            'capabilities': ['vision', 'fast'],
            'free': True,
            'context': '1M tokens'
        },
        'gemini-2.5-pro': {
            'name': 'Gemini 2.5 Pro',
            'provider': 'gemini',
            'capabilities': ['vision', 'reasoning', 'advanced'],
            'free': False,
            'context': '2M tokens'
        },
        
        # OpenRouter models
        'xiaomi/mimo-v2-flash:free': {
            'name': 'Xiaomi MiMo V2 Flash',
            'provider': 'openrouter',
            'capabilities': ['vision', 'fast'],
            'free': True,
            'context': '128K tokens',
            'notes': 'Fast multimodal, good for quick analysis'
        },
        'deepseek/deepseek-r1': {
            'name': 'DeepSeek R1',
            'provider': 'openrouter',
            'capabilities': ['reasoning', 'advanced'],
            'free': False,
            'context': '64K tokens',
            'notes': 'Excellent reasoning, chain-of-thought analysis'
        },
        'nvidia/nemotron-nano-12b-v2-vl:free': {
            'name': 'NVIDIA Nemotron Nano VL',
            'provider': 'openrouter',
            'capabilities': ['vision', 'technical'],
            'free': True,
            'context': '32K tokens',
            'notes': 'Optimized for technical diagrams'
        },
        'qwen/qwen3-235b-a22b': {
            'name': 'Qwen 3 235B',
            'provider': 'openrouter',
            'capabilities': ['reasoning', 'advanced'],
            'free': False,
            'context': '32K tokens',
            'notes': 'Large model, excellent for detailed analysis'
        }
    }
    
    def __init__(self, gemini_api_key: str, openrouter_api_key: Optional[str] = None):
        """Initialize with API keys"""
        self.gemini_api_key = gemini_api_key
        self.openrouter_api_key = openrouter_api_key or os.getenv('OPENROUTER_API_KEY')
        
        # Init Gemini
        self.gemini_client = genai.Client(api_key=gemini_api_key)
        
        # OpenRouter config
        self.openrouter_base = 'https://openrouter.ai/api/v1'
        
        # Analysis prompts
        self.analysis_passes = {
            'overview': self._get_overview_prompt(),
            'technical': self._get_technical_prompt(),
            'components': self._get_components_prompt(),
            'measurements': self._get_measurements_prompt(),
            'quality': self._get_quality_prompt()
        }
    
    def _get_overview_prompt(self) -> str:
        return """Analyze this CAD drawing and provide a comprehensive overview:

1. **Drawing Type & Purpose**: What type of drawing is this? What is its primary purpose?
2. **Overall Layout**: Describe the composition, organization, and structure.
3. **Key Elements**: List the 5-10 most important elements visible.
4. **Complexity**: Rate complexity (Simple/Moderate/Complex/Very Complex) and explain why.
5. **Industry Context**: What industry would use this?

Be detailed and technical."""

    def _get_technical_prompt(self) -> str:
        return """Provide detailed technical analysis:

1. **Dimensions & Scale**: All visible dimensions, units, scale indicators
2. **Line Types**: Different line types (solid, dashed, center, hidden)
3. **Annotations**: All text, labels, callouts, title blocks
4. **Symbols**: Standard symbols, drawing standards (ISO, ANSI, etc.)
5. **Views**: Projection method, all views shown, section indicators

Be extremely thorough."""

    def _get_components_prompt(self) -> str:
        return """Analyze components and features:

1. **Component Inventory**: List every distinct component/part
2. **Geometric Features**: Shapes, holes, slots, chamfers, fillets
3. **Materials**: Material callouts, hatch patterns, finish indicators
4. **Structure**: Assemblies, sub-assemblies, relationships
5. **Special Features**: Unique or notable features

Provide complete technical inventory."""

    def _get_measurements_prompt(self) -> str:
        return """Extract all measurements and specifications:

1. **Dimensional Data**: ALL dimensions with units and tolerances
2. **Critical Dimensions**: Most important dimensions
3. **Coordinates**: Coordinate systems, datum references, grids
4. **Quantities**: Counts, areas, volumes
5. **Specifications**: Weights, capacities, ratings, quality requirements

Create comprehensive dimensional database."""

    def _get_quality_prompt(self) -> str:
        return """Assess quality and completeness:

1. **Clarity**: Rate line clarity, text readability (1-10)
2. **Completeness**: All necessary views, dimensions, details included?
3. **Standards**: Follows drafting standards correctly?
4. **Issues**: Errors, inconsistencies, conflicts, ambiguities
5. **Recommendations**: Improvements needed

Professional quality assessment."""
    
    def preprocess_image(self, image_path: str) -> bytes:
        """Preprocess image to high-quality PNG bytes"""
        img = Image.open(image_path)
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Enhance for better AI analysis
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5)
        
        # Resize if too large
        max_size = 4096
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Convert to bytes
        buffer = BytesIO()
        img.save(buffer, format='PNG', quality=95)
        return buffer.getvalue()
    
    async def analyze_with_gemini(self, image_bytes: bytes, prompt: str, model_id: str = 'gemini-2.5-flash') -> str:
        """Analyze using Gemini"""
        image_part = types.Part.from_bytes(data=image_bytes, mime_type='image/png')
        text_part = types.Part.from_text(text=prompt)
        
        response = self.gemini_client.models.generate_content(
            model=model_id,
            contents=[image_part, text_part],
            config=types.GenerateContentConfig(
                temperature=0.4,
                top_p=0.95,
                top_k=40,
                max_output_tokens=8192,
            )
        )
        
        return response.text
    
    async def analyze_with_openrouter(self, image_bytes: bytes, prompt: str, model_id: str) -> str:
        """Analyze using OpenRouter models"""
        if not self.openrouter_api_key:
            raise ValueError("OpenRouter API key not configured")
        
        # Encode image to base64
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Prepare request
        headers = {
            'Authorization': f'Bearer {self.openrouter_api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://documind.app',  # Optional: your app URL
            'X-Title': 'DocuMind CAD Analyzer'  # Optional: your app name
        }
        
        # Check if model supports vision
        model_info = self.MODELS.get(model_id, {})
        has_vision = 'vision' in model_info.get('capabilities', [])
        
        if has_vision:
            # Vision-capable model
            messages = [{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt},
                    {
                        'type': 'image_url',
                        'image_url': {
                            'url': f'data:image/png;base64,{image_b64}'
                        }
                    }
                ]
            }]
        else:
            # Text-only model (describe image in text first)
            messages = [{
                'role': 'user',
                'content': f"Based on this CAD drawing analysis prompt:\n\n{prompt}\n\nProvide a detailed technical response."
            }]
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f'{self.openrouter_base}/chat/completions',
                headers=headers,
                json={
                    'model': model_id,
                    'messages': messages,
                    'temperature': 0.4,
                    'max_tokens': 8192
                }
            )
            
            response.raise_for_status()
            data = response.json()
            
            return data['choices'][0]['message']['content']
    
    async def comprehensive_analysis(
        self,
        png_path: str,
        model_id: str = 'gemini-2.5-flash'
    ) -> Dict:
        """Run comprehensive 5-pass analysis with selected model"""
        
        print(f"\n🔍 Starting comprehensive CAD analysis...")
        print(f"📊 Model: {self.MODELS.get(model_id, {}).get('name', model_id)}")
        
        # Preprocess image
        print("📸 Preprocessing image...")
        image_bytes = self.preprocess_image(png_path)
        
        results = {
            'image_path': png_path,
            'model_used': model_id,
            'model_info': self.MODELS.get(model_id, {}),
            'analyses': {},
            'summary': {},
            'errors': []
        }
        
        # Determine provider
        model_info = self.MODELS.get(model_id, {})
        provider = model_info.get('provider', 'gemini')
        
        # Run each analysis pass
        total_passes = len(self.analysis_passes)
        for idx, (pass_name, prompt) in enumerate(self.analysis_passes.items(), 1):
            print(f"🎯 Pass {idx}/{total_passes}: {pass_name.upper()}...")
            
            try:
                if provider == 'gemini':
                    analysis = await self.analyze_with_gemini(image_bytes, prompt, model_id)
                elif provider == 'openrouter':
                    analysis = await self.analyze_with_openrouter(image_bytes, prompt, model_id)
                else:
                    raise ValueError(f"Unknown provider: {provider}")
                
                results['analyses'][pass_name] = analysis
                print(f"   ✅ {pass_name} complete ({len(analysis)} chars)")
                
            except Exception as e:
                error_msg = str(e)
                results['errors'].append({'pass': pass_name, 'error': error_msg})
                print(f"   ❌ {pass_name} failed: {error_msg[:100]}")
            
            # Small delay between passes
            if idx < total_passes:
                time.sleep(1)
        
        # Generate synthesis if we have results
        if results['analyses']:
            print("🔄 Generating synthesis...")
            try:
                results['summary'] = await self._generate_synthesis(results['analyses'], model_id, provider, image_bytes)
            except Exception as e:
                print(f"   ⚠️  Synthesis failed: {e}")
                results['summary'] = {'executive_summary': 'Synthesis generation failed'}
        
        print(f"✨ Analysis complete! {len(results['analyses'])} passes successful.\n")
        
        return results
    
    async def _generate_synthesis(self, analyses: Dict, model_id: str, provider: str, image_bytes: bytes) -> Dict:
        """Generate executive summary"""
        combined = "\n\n".join([
            f"=== {name.upper()} ===\n{content}"
            for name, content in analyses.items()
        ])
        
        synthesis_prompt = f"""Based on these CAD drawing analyses, create a concise executive summary:

{combined}

Provide:
1. **Drawing Identity**: Type, purpose, application
2. **Key Specifications**: Most critical dimensions/specs
3. **Notable Features**: Top 5-7 important elements
4. **Technical Assessment**: Quality and completeness rating
5. **Critical Information**: Must-know details

Be concise but complete."""
        
        try:
            if provider == 'gemini':
                summary = await self.analyze_with_gemini(image_bytes, synthesis_prompt, model_id)
            else:
                summary = await self.analyze_with_openrouter(image_bytes, synthesis_prompt, model_id)
            
            return {
                'executive_summary': summary,
                'total_analysis_length': len(combined),
                'synthesis_success': True
            }
        except Exception as e:
            return {
                'executive_summary': 'Synthesis failed',
                'error': str(e),
                'synthesis_success': False
            }
    
    def format_for_rag(self, analysis_results: Dict) -> str:
        """Format analysis for RAG indexing"""
        lines = []
        lines.append("=" * 80)
        lines.append("COMPREHENSIVE CAD DRAWING ANALYSIS")
        lines.append("=" * 80)
        lines.append("")
        
        # Model info
        model_info = analysis_results.get('model_info', {})
        lines.append(f"Model: {model_info.get('name', 'Unknown')}")
        lines.append(f"Provider: {model_info.get('provider', 'Unknown')}")
        lines.append("")
        
        # Executive summary
        if 'summary' in analysis_results and analysis_results['summary'].get('executive_summary'):
            lines.append("EXECUTIVE SUMMARY")
            lines.append("-" * 80)
            lines.append(analysis_results['summary']['executive_summary'])
            lines.append("")
        
        # Detailed analyses
        lines.append("DETAILED ANALYSES")
        lines.append("=" * 80)
        lines.append("")
        
        for pass_name, content in analysis_results.get('analyses', {}).items():
            lines.append(f"\n{pass_name.upper()} ANALYSIS")
            lines.append("-" * 80)
            lines.append(content)
            lines.append("")
        
        return "\n".join(lines)
