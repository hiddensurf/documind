"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    # Google API
    GOOGLE_API_KEY: str
    
    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "documind-index"
    
    # OpenRouter (optional)
    OPENROUTER_API_KEY: str = ""
    
    # LLM Settings
    LLM_MODEL: str = "models/gemini-flash-latest"
    EMBEDDING_MODEL: str = "models/text-embedding-004"
    
    # RAG Settings
    CHUNK_SIZE: int = 1024
    CHUNK_OVERLAP: int = 200
    TOP_K: int = 8
    
    # Upload
    UPLOAD_DIR: str = "uploads"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
