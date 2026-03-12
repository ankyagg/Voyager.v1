"""Phase 2 offline smoke-test — no Ollama needed."""
import sys, os, warnings
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

results = []

def check(name, fn):
    try:
        fn()
        results.append(("PASS", name))
        print(f"  PASS  {name}")
    except Exception as e:
        results.append(("FAIL", name, str(e)))
        print(f"  FAIL  {name}: {e}")

# ── Config ─────────────────────────────────────────────────────────────────────
def t_config():
    from config import (OLLAMA_GENERATE_ENDPOINT, CHROMA_PERSIST_DIR,
                        CHROMA_COLLECTION_NAME, RAG_TOP_K, CHUNK_SIZE)
    assert "11434" in OLLAMA_GENERATE_ENDPOINT
    assert isinstance(RAG_TOP_K, int)
    assert isinstance(CHUNK_SIZE, int)

# ── New tools ──────────────────────────────────────────────────────────────────
def t_weather_tool():
    from tools.weather_tool import get_weather
    w = get_weather("Goa", month=12)
    assert w["destination"] == "Goa"
    assert "temp_c" in w
    w2 = get_weather("Unknown City", month=6)
    assert "destination" in w2

def t_travel_tip_tool():
    from tools.travel_tip_tool import get_travel_tips
    tips = get_travel_tips("Manali", limit=3)
    assert len(tips) == 3
    tips2 = get_travel_tips("Somewhere Obscure", limit=4)
    assert len(tips2) == 4

# ── Embedding utils ────────────────────────────────────────────────────────────
def t_embedding_utils():
    from utils.embedding_utils import create_embeddings, embed_single
    vecs = create_embeddings(["hello goa", "manali mountains"])
    assert len(vecs) == 2
    assert len(vecs[0]) == 384
    single = embed_single("test")
    assert len(single) == 384

# ── Vector store ───────────────────────────────────────────────────────────────
def t_vector_store():
    from rag.vector_store import collection_count
    count = collection_count()
    assert count >= 63, f"Expected >= 63 chunks, got {count}"

# ── Retriever ─────────────────────────────────────────────────────────────────
def t_retriever():
    from rag.retriever import retrieve_context, retrieve_raw
    ctx = retrieve_context("Goa beaches nightlife", n_results=3)
    assert ctx != ""
    assert "Goa" in ctx or "goa" in ctx.lower()
    raw = retrieve_raw("Manali snow", n_results=2)
    assert len(raw) == 2
    assert "source" in raw[0]
    assert "document" in raw[0]

# ── RAG service ────────────────────────────────────────────────────────────────
def t_rag_service():
    from services.rag_service import is_rag_ready, get_context, build_rag_context
    assert is_rag_ready()
    ctx = get_context("Jaipur", ["heritage", "fort"])
    assert isinstance(ctx, str) and len(ctx) > 0
    block = build_rag_context("Kerala", ["backwaters"])
    assert "Retrieved Travel Knowledge" in block

# ── Updated itinerary prompt ───────────────────────────────────────────────────
def t_itinerary_prompt_rag():
    from prompts.itinerary_prompt import build_itinerary_prompt
    # With RAG context
    p = build_itinerary_prompt(
        destination="Goa", duration_days=3, budget="15000 INR",
        attractions=["Baga Beach", "Fort Aguada"],
        budget_info={"estimated_cost": "12000 INR", "breakdown": {}},
        preferences=["beach", "nightlife"],
        rag_context="[Source: goa]\nGoa is a beach destination.",
        weather_info={"temp_c": "22-28", "condition": "Sunny", "travel_tip": "Carry sunscreen"}
    )
    assert "Retrieved travel knowledge" in p
    assert "Sunny" in p
    # Without RAG context (Phase 1 backward-compat)
    p2 = build_itinerary_prompt(
        destination="Goa", duration_days=2, budget="10000 INR",
        attractions=["Baga"], budget_info={}, preferences=[],
    )
    assert "Goa" in p2

# ── Planning service imports (no LLM) ─────────────────────────────────────────
def t_planning_service_import():
    from services import planning_service
    assert hasattr(planning_service, "run")
    assert hasattr(planning_service, "run_as_dict")

# ── Chunker internal ──────────────────────────────────────────────────────────
def t_chunker():
    from rag.ingest_data import _chunk_text
    # Use realistic multi-paragraph text — the chunker splits on paragraph boundaries
    para = "Goa is a beautiful beach destination on the west coast of India. " * 6
    text = "\n\n".join([para, para, para])   # 3 distinct paragraphs
    chunks = _chunk_text(text, chunk_size=400, overlap=80)
    assert len(chunks) >= 2, f"Expected >=2 chunks, got {len(chunks)}"
    for c in chunks:
        assert len(c) >= 30

check("config (Phase 2)", t_config)
check("weather_tool", t_weather_tool)
check("travel_tip_tool", t_travel_tip_tool)
check("embedding_utils", t_embedding_utils)
check("vector_store (63 docs)", t_vector_store)
check("retriever", t_retriever)
check("rag_service", t_rag_service)
check("itinerary_prompt (RAG)", t_itinerary_prompt_rag)
check("planning_service import", t_planning_service_import)
check("chunk_text", t_chunker)

failed = [r for r in results if r[0] == "FAIL"]
print()
if failed:
    print(f"FAILED: {len(failed)} test(s)")
    for f in failed:
        print(f"  - {f[1]}: {f[2]}")
    sys.exit(1)
else:
    print(f"ALL {len(results)} PHASE-2 CHECKS PASSED")
