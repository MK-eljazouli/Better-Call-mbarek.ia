"""
FastAPI application — REST API for the Moroccan legal chatbot.

Endpoints:
    POST /api/chat     — answer a legal question via RAG
    GET  /api/health   — health check
    GET  /api/stats    — database statistics
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from rag_service import answer_question, answer_question_stream
from vector_store import get_table_count
# Force reload

from pydantic import BaseModel
from typing import List, Optional

# ── FastAPI app ───────────────────────────────────────────────
app = FastAPI(
    title="المستشار القانوني — API",
    description="Chatbot juridique marocain avec RAG + Azure OpenAI",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ────────────────────────────────
class ChatRequest(BaseModel):
    message: str


class SourceInfo(BaseModel):
    domain: str
    reference: str
    score: float


class ChatResponse(BaseModel):
    response: str
    sources: List[SourceInfo]


class HealthResponse(BaseModel):
    status: str
    documents_count: Optional[int] = None

# ── Endpoints ─────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Answer a legal question using RAG pipeline (Streaming)."""
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        # Use the generator function
        return StreamingResponse(
            answer_question_stream(request.message),
            media_type="text/event-stream"
        )
    except Exception as e:
        print(f"❌ Error in /api/chat: {e}")
        raise HTTPException(
            status_code=500,
            detail="حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى."
        )


@app.get("/api/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    try:
        count = get_table_count()
        return HealthResponse(status="healthy", documents_count=count)
    except Exception:
        return HealthResponse(status="healthy", documents_count=None)


@app.get("/api/stats")
async def stats():
    """Return database statistics."""
    try:
        count = get_table_count()
        return {"total_documents": count, "status": "ok"}
    except Exception as e:
        return {"total_documents": 0, "status": "error", "detail": str(e)}


# ── Serve frontend static files in production ─────────────────
# ── Serve frontend static files in production ─────────────────
# 1. Check for local 'static' directory (Deployment mode)
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "static")
if not os.path.isdir(FRONTEND_DIST):
    # 2. Fallback to sibling directory (Development mode)
    FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the frontend SPA for any non-API route."""
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
