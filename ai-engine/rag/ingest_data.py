"""
rag/ingest_data.py
───────────────────
Phase 2 — Data ingestion script.

Reads all .txt files from  data/travel_knowledge/,
splits them into overlapping chunks, embeds them via all-MiniLM-L6-v2,
and stores them in the persistent ChromaDB vector store.

Run once (or whenever you add new knowledge files):

    python ingest_data.py

Re-running this script will RESET the collection and re-ingest everything.
"""

import os
import sys
import re
from typing import List, Tuple

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from rag.vector_store import get_collection, reset_collection

# ── Configurable chunking parameters ──────────────────────────────────────────
try:
    from config import CHUNK_SIZE, CHUNK_OVERLAP
except ImportError:
    CHUNK_SIZE    = 400   # characters per chunk (keeps prompts small)
    CHUNK_OVERLAP = 80    # overlap to preserve context across chunk boundaries

# ── Knowledge base directory ───────────────────────────────────────────────────
KNOWLEDGE_DIR = os.path.join(_ENGINE_ROOT, "data", "travel_knowledge")


def _read_txt_files(directory: str) -> List[Tuple[str, str]]:
    """
    Read all .txt files in *directory*.

    Returns
    -------
    List[Tuple[str, str]]
        List of (filename_stem, content) pairs. filename_stem is used as the
        source metadata tag (e.g. "goa", "manali").
    """
    documents = []
    if not os.path.isdir(directory):
        print(f"  WARNING: Knowledge directory not found: {directory}")
        return documents

    for filename in sorted(os.listdir(directory)):
        if not filename.endswith(".txt"):
            continue
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, encoding="utf-8") as f:
                content = f.read().strip()
            if content:
                stem = os.path.splitext(filename)[0]
                documents.append((stem, content))
                print(f"  Read: {filename} ({len(content)} chars)")
        except OSError as exc:
            print(f"  WARNING: Could not read {filename}: {exc}")

    return documents


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split *text* into overlapping, sentence-aware chunks.

    Strategy:
    1. Split into sentences (on '. ', '\\n\\n', or '\\n- ').
    2. Accumulate sentences until the chunk exceeds chunk_size.
    3. Start the next chunk CHUNK_OVERLAP characters before the end.

    Keeping chunks small ensures the retrieved snippets fit comfortably
    within the local LLM's context window.
    """
    # Normalise line endings and collapse whitespace
    text = re.sub(r"\r\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Split on paragraph boundaries (double newline) first
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks = []
    current = ""

    for para in paragraphs:
        # If adding this paragraph would exceed size, flush current chunk
        if current and len(current) + len(para) + 2 > chunk_size:
            chunks.append(current.strip())
            # Start new chunk with overlap from the end of the previous chunk
            current = current[-overlap:] if len(current) > overlap else current
        current = (current + "\n\n" + para).strip() if current else para

    # Flush remaining text
    if current.strip():
        chunks.append(current.strip())

    # Safety: split any chunk that is still too long
    result = []
    for chunk in chunks:
        if len(chunk) <= chunk_size * 1.5:
            result.append(chunk)
        else:
            # Force-split on sentences
            sentences = re.split(r"(?<=\.)\s+", chunk)
            buf = ""
            for sent in sentences:
                if len(buf) + len(sent) > chunk_size and buf:
                    result.append(buf.strip())
                    buf = buf[-overlap:] if len(buf) > overlap else ""
                buf = buf + " " + sent if buf else sent
            if buf.strip():
                result.append(buf.strip())

    return [c for c in result if len(c) > 30]   # drop trivially short chunks


def ingest(reset: bool = True) -> int:
    """
    Ingest all travel knowledge files into ChromaDB.

    Parameters
    ----------
    reset : bool
        If True (default), delete the existing collection before ingesting.
        Set to False to append without clearing.

    Returns
    -------
    int
        Total number of chunks stored.
    """
    print("\n" + "="*54)
    print("  Voyager AI Engine — Phase 2 Data Ingestion")
    print("="*54)

    # ── Step 1: Read files ─────────────────────────────────────────────────────
    print(f"\n[1/4] Reading knowledge files from:\n  {KNOWLEDGE_DIR}")
    documents = _read_txt_files(KNOWLEDGE_DIR)

    if not documents:
        print("  ERROR: No .txt files found. Cannot ingest.")
        return 0

    print(f"  Total files loaded: {len(documents)}")

    # ── Step 2: Chunk ──────────────────────────────────────────────────────────
    print(f"\n[2/4] Chunking text (chunk_size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP}) ...")
    all_chunks: List[str]     = []
    all_ids:    List[str]     = []
    all_meta:   List[dict]    = []

    for source, content in documents:
        chunks = _chunk_text(content)
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_ids.append(f"{source}_{i:04d}")
            all_meta.append({"source": source, "chunk_index": i})
        print(f"  {source:<12} → {len(chunks)} chunks")

    print(f"  Total chunks: {len(all_chunks)}")

    # ── Step 3: Reset + get collection ────────────────────────────────────────
    print("\n[3/4] Preparing ChromaDB collection ...")
    if reset:
        collection = reset_collection()
        print(f"  Collection reset and ready.")
    else:
        from rag.vector_store import get_collection
        collection = get_collection()
        print(f"  Appending to existing collection ({collection.count()} docs).")

    # ── Step 4: Embed + upsert in batches ────────────────────────────────────
    BATCH_SIZE = 50
    print(f"\n[4/4] Embedding and storing {len(all_chunks)} chunks (batch={BATCH_SIZE}) ...")

    for start in range(0, len(all_chunks), BATCH_SIZE):
        end   = min(start + BATCH_SIZE, len(all_chunks))
        batch_docs  = all_chunks[start:end]
        batch_ids   = all_ids[start:end]
        batch_meta  = all_meta[start:end]

        collection.upsert(
            documents=batch_ids,       # ChromaDB uses these as IDs
            ids=batch_ids,
            metadatas=batch_meta,
        )
        # Upsert with actual text so retrieval returns document content
        collection.upsert(
            ids=batch_ids,
            documents=batch_docs,      # actual text for retrieval
            metadatas=batch_meta,
        )
        print(f"  Stored chunks {start+1}-{end} / {len(all_chunks)}")

    final_count = collection.count()
    print(f"\nIngestion complete. Total documents in store: {final_count}")
    print("="*54 + "\n")
    return final_count


if __name__ == "__main__":
    ingest(reset=True)
