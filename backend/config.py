"""
Centralized configuration — loads from environment variables / .env file.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Azure OpenAI ──────────────────────────────────────────────
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_OPENAI_CHAT_DEPLOYMENT = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "gpt-4o-mini")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT", "text-embedding-3-small")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-06-01")

# ── Azure SQL Database ────────────────────────────────────────
AZURE_SQL_CONNECTION_STRING = os.getenv("AZURE_SQL_CONNECTION_STRING", "")

# ── Data ──────────────────────────────────────────────────────
DATA_PATH = os.getenv("DATA_PATH", os.path.join(os.path.dirname(__file__), "..", "Data"))

# ── RAG Parameters ────────────────────────────────────────────
EMBEDDING_DIMENSIONS = 1536
TOP_K_RESULTS = 5
