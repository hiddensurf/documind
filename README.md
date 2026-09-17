# DocuMind

A React and FastAPI document assistant that combines retrieval-augmented generation with document conversations and CAD-oriented analysis paths.

## Implemented capabilities

- Upload and list PDF, DOCX, TXT, DXF, and DWG inputs
- Index document content for RAG with LlamaIndex, Gemini embeddings, and Pinecone
- Create persistent local conversations, select documents, send messages, and generate Mermaid mind maps
- Parse and render CAD files, expose manifests and rendered output, and run visual or hybrid CAD analysis
- Choose between configured Gemini and OpenRouter-backed analysis models
- Use a React/Vite interface with document, conversation, model, and theme controls

## Architecture

```text
React + Vite frontend
        |
        | HTTP
        v
FastAPI routes
├── document and conversation services
├── RAG service (LlamaIndex + Pinecone + Gemini)
└── CAD pipeline
    ├── conversion, parsing, rendering, and manifests
    ├── visual analysis
    └── CV-assisted hybrid analysis
```

## Local setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Tesseract OCR for OCR-assisted CAD analysis
- Google AI and Pinecone API keys
- An OpenRouter key only when using OpenRouter-backed models

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
mkdir -p uploads cad_uploads cad_renders cad_manifests conversations
```

Create `backend/.env`:

```env
GOOGLE_API_KEY=your_google_api_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=documind-index
OPENROUTER_API_KEY=your_openrouter_key
LLM_MODEL=models/gemini-flash-latest
EMBEDDING_MODEL=models/text-embedding-004
CHUNK_SIZE=1024
CHUNK_OVERLAP=200
TOP_K=8
UPLOAD_DIR=uploads
```

Start the API:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

From the repository root:

```bash
npm install
npm run dev
```

Open http://localhost:5173. The backend OpenAPI docs are available at http://localhost:8000/docs.

## API areas

- `/api/documents` for upload, listing, deletion, and CAD artifacts
- `/api/conversations` for conversation state, selected documents, messages, and mind maps
- conversation analysis routes for visual and hybrid CAD analysis
- `/api/models` for the model catalog exposed by the backend
- `/api/health` for a health check

## Notes

- DWG conversion depends on a compatible local converter. DXF handling is implemented directly with `ezdxf`.
- Uploaded data, CAD artifacts, and conversation files are stored in local project directories.
- Model availability and quotas depend on the configured providers and keys.
