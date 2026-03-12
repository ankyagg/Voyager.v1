"""
rag/retriever.py
─────────────────
Phase 2 — Semantic retriever.

Provides retrieve_context(query, n_results) which queries ChromaDB
and returns the top-N most semantically relevant text chunks.

Design
------
* Queries are embedded with the same ONNX model used during ingestion,
  guaranteeing that similarity scores are meaningful.
* Returns a single concatenated context string ready to paste into an
  LLM prompt (bounded to avoid blowing the local model's context window).
* Gracefully handles the case where the vector store has no documents yet.
"""

from __future__ import annotations

import os
import sys

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from rag.vector_store import get_collection, collection_count

# ── Configuration ──────────────────────────────────────────────────────────────
try:
    from config import RAG_TOP_K, RAG_MAX_CONTEXT_CHARS
except ImportError:
    RAG_TOP_K             = 3     # number of chunks to retrieve per query
    RAG_MAX_CONTEXT_CHARS = 1200  # max total chars for the context block


def retrieve_context(query: str, n_results: int = RAG_TOP_K) -> str:
    """
    Retrieve the most relevant travel knowledge chunks for *query*.

    Parameters
    ----------
    query : str
        The search query — typically the destination name or user request.
    n_results : int
        How many chunks to return (default: RAG_TOP_K from config).

    Returns
    -------
    str
        Concatenated relevant knowledge snippets, separated by '---'.
        Returns an empty string if the vector store is empty.
    """
    if collection_count() == 0:
        return ""   # vector store not yet populated; caller handles gracefully

    collection = get_collection()

    # ChromaDB expects n_results ≤ number of documents
    n = min(n_results, collection_count())

    results = collection.query(
        query_texts=[query],
        n_results=n,
        include=["documents", "metadatas", "distances"],
    )

    # results["documents"] is a list of lists (one per query)
    docs      = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    if not docs:
        return ""

    # Build context string — ordered by relevance (closest distance = most relevant)
    parts = []
    total_chars = 0

    for doc, meta, dist in zip(docs, metadatas, distances):
        source = meta.get("source", "unknown")
        header = f"[Source: {source}]"
        snippet = f"{header}\n{doc}"

        if total_chars + len(snippet) > RAG_MAX_CONTEXT_CHARS:
            # Truncate last snippet to fit within limit
            remaining = RAG_MAX_CONTEXT_CHARS - total_chars
            if remaining > 100:   # only append if it's meaningful
                parts.append(snippet[:remaining] + "…")
            break

        parts.append(snippet)
        total_chars += len(snippet)

    return "\n---\n".join(parts)


def retrieve_raw(query: str, n_results: int = RAG_TOP_K) -> list:
    """
    Return raw retrieval results as a list of dicts for debugging / testing.

    Each dict has keys: document, source, distance.
    """
    if collection_count() == 0:
        return []

    collection = get_collection()
    n = min(n_results, collection_count())

    results = collection.query(
        query_texts=[query],
        n_results=n,
        include=["documents", "metadatas", "distances"],
    )

    docs      = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    return [
        {"document": d, "source": m.get("source", "?"), "distance": round(dist, 4)}
        for d, m, dist in zip(docs, metadatas, distances)
    ]
