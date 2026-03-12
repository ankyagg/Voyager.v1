"""
services/rag_service.py
────────────────────────
Phase 2 — RAG (Retrieval Augmented Generation) service.

Single responsibility: given a travel query, return the most relevant
knowledge context from the ChromaDB vector store.

Design principles
-----------------
* Handles the case where the store is empty (returns "" gracefully).
* Exposes a simple string-returning function so agents don't need to
  know anything about ChromaDB.
* Also exposes build_rag_context() which combines retrieval + formatting
  into a prompt-ready block.
"""

from __future__ import annotations

import os
import sys

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from rag.retriever import retrieve_context, retrieve_raw
from rag.vector_store import collection_count


def is_rag_ready() -> bool:
    """Return True if the vector store has been populated."""
    return collection_count() > 0


def get_context(destination: str, preferences: list | None = None) -> str:
    """
    Retrieve relevant travel knowledge for a destination.

    Builds a composite query from the destination name and any
    user preferences, then returns the top-K context chunks.

    Parameters
    ----------
    destination  : str
        The travel destination (e.g. "Goa").
    preferences  : list[str] or None
        Optional user interests (e.g. ["beaches", "nightlife"]).

    Returns
    -------
    str
        Concatenated relevant knowledge snippets, or "" if store is empty.
    """
    if not is_rag_ready():
        return ""

    # Build a rich query: destination + preferences improves chunk relevance
    pref_str = " ".join(preferences) if preferences else ""
    query = f"{destination} travel {pref_str}".strip()

    return retrieve_context(query)


def build_rag_context(destination: str, preferences: list | None = None) -> str:
    """
    Return a formatted context block ready to inject into a prompt.

    Wraps the raw context in a clear header so the LLM understands what
    the block represents.

    Parameters
    ----------
    destination  : str
        Travel destination name.
    preferences  : list[str] or None
        Optional user preferences to guide retrieval.

    Returns
    -------
    str
        Formatted context block, or empty string if RAG is not ready.
    """
    raw = get_context(destination, preferences)
    if not raw:
        return ""

    return (
        f"=== Retrieved Travel Knowledge for {destination} ===\n"
        + raw
        + "\n=== End of Retrieved Knowledge ==="
    )


def debug_retrieval(destination: str, n: int = 5) -> None:
    """
    Print the top-N raw retrieval results for debugging.

    Parameters
    ----------
    destination : str
        Destination to query.
    n : int
        Number of chunks to show.
    """
    print(f"\n[RAG Debug] Query: '{destination}'")
    results = retrieve_raw(destination, n_results=n)
    if not results:
        print("  Vector store is empty — run: python rag/ingest_data.py")
        return
    for i, r in enumerate(results, 1):
        print(f"\n  [{i}] Source: {r['source']} | Distance: {r['distance']}")
        print(f"  {r['document'][:200]}…")
