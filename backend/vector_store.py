"""
Vector store — Local JSON Database fallback since Azure SQL DB is firewalled.
Uses in-memory pure Python cosine similarity search.
"""
import json
import os
import math
from typing import List, Dict, Any

from config import TOP_K_RESULTS

_local_db: List[Dict[str, Any]] | None = None
DB_PATH = os.path.join(os.path.dirname(__file__), "local_db.json")

def _load_db():
    global _local_db
    if _local_db is None:
        if os.path.exists(DB_PATH):
            try:
                with open(DB_PATH, "r", encoding="utf-8") as f:
                    _local_db = json.load(f)
                print(f"✅ Loaded {_local_db and len(_local_db) or 0} documents from local vector DB.")
            except Exception as e:
                print(f"⚠️ Error loading local DB: {e}")
                _local_db = []
        else:
            print("⚠️ local_db.json not found. Run ingest_local.py or build_local_db.py")
            _local_db = []
    
    return _local_db

def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)

def create_table() -> None:
    pass

def clear_table() -> None:
    pass

def insert_chunk(domain: str, reference: str, content: str, embedding: List[float]) -> None:
    pass

def insert_chunks_batch(chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> None:
    pass

def search_similar(
    query_embedding: List[float], top_k: int = TOP_K_RESULTS
) -> List[Dict[str, Any]]:
    """
    Find the top-K most similar legal texts using in-memory cosine distance.
    Returns list of dicts with domain, reference, content, and score.
    """
    db = _load_db()
    
    if not db:
        return []
    
    results = []
    for doc in db:
        doc_embedding = doc.get("embedding", [])
        if not doc_embedding: continue
        
        sim = _cosine_similarity(query_embedding, doc_embedding)
        results.append({
            "id": doc.get("id"),
            "domain": doc.get("domain", ""),
            "reference": doc.get("reference", ""),
            "content": doc.get("content", ""),
            "score": round(sim, 4),
        })
    
    # Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_k]

def get_table_count() -> int:
    """Return the number of rows in local DB."""
    db = _load_db()
    return len(db)
