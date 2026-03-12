"""
utils/embedding_utils.py
─────────────────────────
Embedding helper for Phase 2 RAG.

Uses ChromaDB's bundled ONNXMiniLM-L6-v2 embedding function
(the same model as sentence-transformers all-MiniLM-L6-v2, run via
ONNX Runtime — no separate PyTorch installation needed).

The function is a singleton: the embedding model is loaded once and
cached so repeated calls don't reload it.
"""

from __future__ import annotations
from typing import List

# ── Lazy singleton ─────────────────────────────────────────────────────────────
_embedding_fn = None


def _get_embedding_fn():
    """Load the ONNX embedding function once and cache it."""
    global _embedding_fn
    if _embedding_fn is None:
        from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
        _embedding_fn = DefaultEmbeddingFunction()  # all-MiniLM-L6-v2 via ONNX
    return _embedding_fn


# ── Public API ─────────────────────────────────────────────────────────────────

def create_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Create embeddings for a list of text strings.

    Uses the ChromaDB-bundled all-MiniLM-L6-v2 ONNX model (384 dimensions).
    This is equivalent to sentence-transformers all-MiniLM-L6-v2 but runs
    via ONNX Runtime without requiring a separate PyTorch installation.

    Parameters
    ----------
    texts : List[str]
        List of strings to embed.

    Returns
    -------
    List[List[float]]
        List of 384-dimensional float vectors, one per input text.
    """
    if not texts:
        return []

    ef = _get_embedding_fn()
    return list(ef(texts))


def embed_single(text: str) -> List[float]:
    """
    Convenience wrapper to embed a single string.

    Parameters
    ----------
    text : str
        Input text to embed.

    Returns
    -------
    List[float]
        384-dimensional embedding vector.
    """
    results = create_embeddings([text])
    return results[0] if results else []
