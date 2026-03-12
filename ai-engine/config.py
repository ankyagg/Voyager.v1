# config.py
# ─────────────────────────────────────────────────────────────────────────────
# Central configuration for the Voyager AI Engine (Phase 0 / 1 / 2).
# All tuneable values live here so every other module imports from one place.
# ─────────────────────────────────────────────────────────────────────────────

import os
_ENGINE_ROOT = os.path.dirname(os.path.abspath(__file__))

# ── Ollama connection ─────────────────────────────────────────────────────────
OLLAMA_BASE_URL: str = "http://localhost:11434"
OLLAMA_GENERATE_ENDPOINT: str = f"{OLLAMA_BASE_URL}/api/generate"

# Model to use for generation.
# Change this to any model you have pulled locally, e.g. "mistral", "gemma2".
OLLAMA_MODEL: str = "llama3"

# ── Request settings ──────────────────────────────────────────────────────────
# Maximum seconds to wait for Ollama before giving up.
REQUEST_TIMEOUT: int = 120

# Generation hyper-parameters forwarded to Ollama.
# temperature=0.2  →  low randomness keeps JSON well-formed.
# num_predict      →  maximum tokens to generate.
GENERATION_OPTIONS: dict = {
    "temperature": 0.2,
    "num_predict": 1024,
}

# ── Phase 2 — RAG / ChromaDB settings ────────────────────────────────────────
# Persistent storage path for the vector index.
CHROMA_PERSIST_DIR: str = os.path.join(_ENGINE_ROOT, "data", "chroma_db")

# Name of the ChromaDB collection that holds travel knowledge.
CHROMA_COLLECTION_NAME: str = "travel_knowledge"

# Number of text chunks to retrieve per query (keep small for small context windows).
RAG_TOP_K: int = 3

# Maximum characters of retrieved context to inject into the LLM prompt.
# At ~4 chars/token, 1200 chars ≈ 300 tokens — safe for llama3 7B.
RAG_MAX_CONTEXT_CHARS: int = 1200

# ── Phase 2 — Text chunking settings ─────────────────────────────────────────
CHUNK_SIZE: int = 400     # characters per chunk
CHUNK_OVERLAP: int = 80   # overlap between consecutive chunks

# ── Legacy shim (Phase 0 compatibility) ──────────────────────────────────────
def get_llm():  # noqa: ANN201
    """Compatibility shim — not used in Phase 1/2. Use llm.ollama_client.generate()."""
    raise NotImplementedError(
        "get_llm() is not implemented. Use llm.ollama_client.generate() instead."
    )