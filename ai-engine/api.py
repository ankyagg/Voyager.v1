"""
ai-engine/api.py
─────────────────
Voyager AI Engine — FastAPI HTTP Server

Exposes the Phase 2 agentic pipeline (Planner → Tools → RAG → Itinerary)
as REST endpoints so the Node.js backend can call it.

Start with:
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
    GET  /health            → engine health check
    POST /api/plan          → full agentic itinerary pipeline
    POST /api/chat          → single-turn LLM chat with travel context
    POST /api/replan        → future: replan existing itinerary
"""

from __future__ import annotations

import os
import sys
import json
import logging

# ── Path setup — must be first ─────────────────────────────────────────────────
_ENGINE_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

# ── FastAPI imports ────────────────────────────────────────────────────────────
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# ── App setup ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("voyager.api")

app = FastAPI(
    title="Voyager AI Engine",
    description="Agentic travel planning API powered by Ollama + RAG",
    version="2.0.0",
)

# Allow requests from the frontend (5173) and backend (5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response schemas ─────────────────────────────────────────────────

class PlanRequest(BaseModel):
    """Body for POST /api/plan"""
    request: str = Field(
        ...,
        description="Natural language travel request",
        example="Plan a 4 day trip to Goa under 20000 INR with beaches and nightlife",
    )


class ChatRequest(BaseModel):
    """Body for POST /api/chat"""
    message: str = Field(..., description="User message")
    context: dict = Field(default_factory=dict, description="Optional context (tripId, destination, etc.)")


class ReplanRequest(BaseModel):
    """Body for POST /api/replan"""
    itinerary: dict = Field(..., description="Existing itinerary JSON to modify")
    update: str = Field(..., description="What to change in the itinerary")


# ── Startup: pre-warm the RAG index ───────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Log RAG readiness on startup (non-blocking)."""
    try:
        from rag.vector_store import collection_count
        count = collection_count()
        if count > 0:
            logger.info(f"RAG vector store ready: {count} documents loaded.")
        else:
            logger.warning(
                "RAG vector store is EMPTY. "
                "Run: python main.py --ingest   to load travel knowledge."
            )
    except Exception as exc:
        logger.warning(f"Could not check RAG store: {exc}")


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health():
    """Returns engine health and RAG/LLM status."""
    try:
        from rag.vector_store import collection_count
        rag_count = collection_count()
        rag_ready = rag_count > 0
    except Exception:
        rag_count = 0
        rag_ready = False

    try:
        from config import OLLAMA_BASE_URL, OLLAMA_MODEL
        import requests
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=3)
        ollama_up = r.status_code == 200
    except Exception:
        ollama_up = False

    return {
        "status": "ok",
        "engine": "Voyager AI Engine v2 (Phase 2 RAG)",
        "ollama": "connected" if ollama_up else "unreachable",
        "rag": f"ready ({rag_count} docs)" if rag_ready else "empty — run ingest",
    }


# ── POST /api/plan ─────────────────────────────────────────────────────────────

@app.post("/api/plan", tags=["AI"])
async def plan_itinerary(body: PlanRequest):
    """
    Run the full Phase-2 agentic pipeline:
    Planner Agent → Tools → Weather → Tips → RAG → Itinerary Agent

    Returns a structured JSON itinerary.
    """
    logger.info(f"[/api/plan] Request: {body.request[:80]}...")

    try:
        from services.planning_service import run as run_pipeline
        itinerary = run_pipeline(body.request)
        result = json.loads(itinerary.model_dump_json())
        logger.info(f"[/api/plan] Itinerary generated for: {result.get('destination', '?')}")
        return result

    except ConnectionError:
        logger.error("[/api/plan] Ollama is not running.")
        raise HTTPException(
            status_code=503,
            detail="AI engine error: Ollama is not running. Start with: ollama serve",
        )
    except TimeoutError:
        logger.error("[/api/plan] Ollama request timed out.")
        raise HTTPException(
            status_code=504,
            detail="AI engine error: LLM request timed out. Try a smaller model or increase timeout.",
        )
    except ValueError as exc:
        logger.error(f"[/api/plan] JSON parse error: {exc}")
        raise HTTPException(
            status_code=422,
            detail=f"AI engine returned malformed JSON: {exc}",
        )
    except Exception as exc:
        logger.error(f"[/api/plan] Unexpected error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /api/chat ─────────────────────────────────────────────────────────────

@app.post("/api/chat", tags=["AI"])
async def chat(body: ChatRequest):
    """
    Single-turn travel assistant chat.
    Calls the LLM directly with the user message and optional trip context.
    Returns: { "reply": "<assistant response text>" }
    """
    logger.info(f"[/api/chat] Message: {body.message[:60]}...")

    # Build a travel-scoped system prompt
    context_str = ""
    if body.context:
        trip_id = body.context.get("tripId", "")
        destination = body.context.get("destination", "")
        if destination:
            context_str = f"The user is planning a trip to {destination}."
        elif trip_id:
            context_str = f"The user is planning a trip (ID: {trip_id})."

    system_prompt = (
        "You are Voyager AI, an expert travel planning assistant. "
        "You help users plan trips, suggest destinations, estimate budgets, "
        "and create day-by-day itineraries. Keep responses concise and helpful. "
        f"{context_str}"
    )

    full_prompt = f"{system_prompt}\n\nUser: {body.message}\n\nAssistant:"

    try:
        from llm.ollama_client import generate
        reply = generate(full_prompt)

        # Clean up common LLM artifacts
        reply = reply.strip()
        if reply.lower().startswith("assistant:"):
            reply = reply[len("assistant:"):].strip()

        return {"reply": reply}

    except ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start with: ollama serve",
        )
    except TimeoutError:
        raise HTTPException(status_code=504, detail="LLM request timed out.")
    except Exception as exc:
        logger.error(f"[/api/chat] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── POST /api/replan ───────────────────────────────────────────────────────────

@app.post("/api/replan", tags=["AI"])
async def replan(body: ReplanRequest):
    """
    Replan an existing itinerary based on a user update request.
    Simple implementation: prepend itinerary context to the update request
    and run the full pipeline again.
    """
    existing = body.itinerary
    destination = existing.get("destination", "Unknown")
    duration = existing.get("duration_days", existing.get("durationDays", 3))
    budget = existing.get("budget_estimate", existing.get("budgetEstimate", "15000 INR"))

    try:
        from services.planning_service import run as run_pipeline
        itinerary = run_pipeline(body.update, existing_itinerary=existing)
        return json.loads(itinerary.model_dump_json())
    except Exception as exc:
        logger.error(f"[/api/replan] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ── Dev entrypoint (python api.py) ────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
