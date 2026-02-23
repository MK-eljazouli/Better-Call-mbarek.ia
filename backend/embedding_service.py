"""
Embedding service — wraps Azure OpenAI text-embedding-3-small.
"""
from typing import List
from openai import AzureOpenAI

from config import (
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
)

_client: AzureOpenAI | None = None


def _get_client() -> AzureOpenAI:
    global _client
    if _client is None:
        _client = AzureOpenAI(
            azure_endpoint=AZURE_OPENAI_ENDPOINT,
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
        )
    return _client


def get_embedding(text: str) -> List[float]:
    """Generate embedding for a single text string."""
    client = _get_client()
    response = client.embeddings.create(
        input=[text],
        model=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    )
    return response.data[0].embedding


def get_embeddings_batch(texts: List[str], batch_size: int = 100) -> List[List[float]]:
    """
    Generate embeddings for a list of texts, processing in batches.
    Azure OpenAI allows up to ~2048 inputs per call, but we keep batches
    small to avoid timeouts and memory issues.
    """
    client = _get_client()
    all_embeddings: List[List[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.embeddings.create(
            input=batch,
            model=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
        )
        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)
        print(f"  🔢 Embedded {min(i + batch_size, len(texts))}/{len(texts)}")

    return all_embeddings
