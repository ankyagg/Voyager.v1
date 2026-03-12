"""
rag/vector_store.py
────────────────────
Persistent ChromaDB vector store for Phase 2 RAG.

Design decisions
----------------
* Uses ChromaDB's PersistentClient so the index survives restarts.
* The store lives at  ai-engine/data/chroma_db/  (configurable via config.py).
* All access goes through get_collection() — callers never touch the raw client.
* The embedding function (all-MiniLM-L6-v2 ONNX) is attached at collection
  creation time so queries and inserts always use the same model.
"""

from __future__ import annotations

import os
import sys

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

# ── Configuration ──────────────────────────────────────────────────────────────
try:
    from config import CHROMA_PERSIST_DIR, CHROMA_COLLECTION_NAME
except ImportError:
    CHROMA_PERSIST_DIR = os.path.join(_ENGINE_ROOT, "data", "chroma_db")
    CHROMA_COLLECTION_NAME = "travel_knowledge"

# ── Singleton client + collection ──────────────────────────────────────────────
_client: chromadb.PersistentClient | None = None
_embedding_fn = DefaultEmbeddingFunction()  # all-MiniLM-L6-v2 via ONNX


def _get_client() -> chromadb.PersistentClient:
    """Return (or create) the persistent ChromaDB client."""
    global _client
    if _client is None:
        os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def get_collection() -> chromadb.Collection:
    """
    Return the travel_knowledge collection, creating it if it doesn't exist.

    Returns
    -------
    chromadb.Collection
        The persistent collection with the ONNX embedding function attached.
    """
    client = _get_client()
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        embedding_function=_embedding_fn,
        metadata={"hnsw:space": "cosine"},   # cosine similarity for text relevance
    )
    return collection


def reset_collection() -> chromadb.Collection:
    """
    Delete and recreate the collection (used during re-ingestion).

    Returns
    -------
    chromadb.Collection
        Fresh empty collection.
    """
    client = _get_client()
    try:
        client.delete_collection(name=CHROMA_COLLECTION_NAME)
        print(f"  Deleted existing collection '{CHROMA_COLLECTION_NAME}'.")
    except Exception:
        pass   # collection didn't exist yet; that's fine
    return get_collection()


def collection_count() -> int:
    """Return the number of documents currently in the collection."""
    return get_collection().count()
