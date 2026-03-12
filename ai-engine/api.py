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
    group_preferences: dict = Field(default_factory=dict, description="Group poll votes (e.g. {'adventure': 3, 'food': 1})")
    accepted_suggestions: list = Field(default_factory=list, description="Suggestions voted to be included")
    participants_count: int = Field(default=1, description="Number of trip participants")


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

    # ── Inject Collaborative Context ──────────────────────────────────────────
    collab_context = ""
    if body.participants_count > 1:
        collab_context += f"\n\n[COLLABORATIVE TRIP: {body.participants_count} participants]"
        if body.group_preferences:
            collab_context += f"\nGroup Preferences Poll: {json.dumps(body.group_preferences)}. Balance the itinerary to reflect these preferences safely."
        if body.accepted_suggestions:
            collab_context += f"\nREQUIRED ACTIVITIES (Must Include): {', '.join(body.accepted_suggestions)}."
            
    enhanced_request = body.request + collab_context

    try:
        from services.planning_service import run as run_pipeline
        itinerary = run_pipeline(enhanced_request)
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

    # ── Build enriched system prompt ──────────────────────────────────────────
    context_str = ""
    saved_places_str = ""
    budget_str = ""
    participants_str = ""
    preferences_str = ""

    if body.context:
        destination = body.context.get("destination", "")
        trip_id     = body.context.get("tripId", "")
        budget      = body.context.get("budget", "")
        travelers   = body.context.get("travelers", "")
        saved       = body.context.get("savedPlaces", [])   # list of place names
        group_prefs = body.context.get("groupPreferences", {})

        if destination:
            context_str = f"The user is currently planning a trip to **{destination}**."
        elif trip_id:
            context_str = f"The user is planning a trip (ID: {trip_id})."

        if budget:
            budget_str = f"\n- Total trip budget: {budget}. Track expenses and flag if suggestions exceed this."

        if travelers:
            participants_str = (
                f"\n- The trip involves {travelers} traveler(s). "
                "Consider that different participants may have different preferences. "
                "Propose optional activities and compromises when interests may conflict."
            )

        if group_prefs:
            import json
            preferences_str = (
                f"\n- GROUP PREFERENCES (from polls): {json.dumps(group_prefs)}. "
                "Please heavily weight the itinerary towards the highest voted categories, "
                "while still providing a balanced experience."
            )

        if saved:
            names = ", ".join(str(p) for p in saved[:10])
            saved_places_str = (
                f"\n- The user has already saved these destinations/places: [{names}]. "
                "Prioritize and integrate these saved places naturally into the schedule. "
                "Avoid suggesting completely unrelated places unless necessary."
            )

    system_prompt = f"""\
You are Voyager AI — an expert, friendly travel planning assistant.

## Core Behavior
- Help users plan trips, suggest destinations, estimate budgets, and create day-by-day itineraries.
- Be conversational, warm, and enthusiastic about travel.
- Provide specific, actionable recommendations with real place names.
{context_str}

## Trip Context{budget_str}{participants_str}{preferences_str}{saved_places_str}

## Planning Principles (apply to every itinerary or plan you produce)

### 1. Collaborative Trip Awareness
- When multiple travelers are involved, consider varied interests and age groups.
- Mark activities as [Optional] when they may not suit all participants.
- Suggest compromise activities (e.g. beach + nearby cultural site) when interests differ.
- Offer 1–2 alternative activities per day when appropriate.

### 2. Destination Integration
- If the user has saved places, build the itinerary around those first.
- Integrate saved destinations naturally — don't treat them as add-ons.
- Only suggest additional places if the saved ones don't fill the day adequately.

### 3. Travel Efficiency
- Group nearby attractions in the same time block (Morning / Afternoon / Evening).
- Minimize unnecessary travel distance — arrange activities in a logical geographic flow.
- Flag if any two consecutive activities have an unrealistic travel gap (>1.5 hrs apart).
- Suggest the best order to visit places to reduce back-and-forth.

### 4. Budget Awareness
- When budget is provided, estimate approximate daily expenses.
- Clearly label expensive activities (💰) and suggest budget-friendly alternatives.
- If the total plan is likely to exceed the budget, highlight this and offer cheaper options.
- Maintain a balance: don't sacrifice experience for cost unless the user requests it.

### 5. Smart Plan Modification
- When a user modifies trip parameters (adds destinations, changes duration, adjusts budget):
  * Preserve the existing itinerary sections that are unaffected.
  * Only update the specifically affected days or activities.
  * Briefly explain what was changed and why.
- Never regenerate the entire plan unless explicitly asked.

### 6. Post-Plan Optimization (optional, non-intrusive)
- After generating a plan, add a brief **"✨ Suggested Improvements"** section (2–3 bullet points max).
- Suggestions may include: better activity ordering, reduced travel time, more even day distribution.
- These are SUGGESTIONS ONLY — do not override the plan you just generated.
- Keep this section short and clearly separated from the main itinerary.

### 7. Structured Output Format
Always use this section order when generating itineraries:

```
Day N: [Title]
- Morning: [activity]
- Afternoon: [activity]  
- Evening: [activity / dinner recommendation]
- 💰 Estimated daily budget: ₹[amount]
```

Then add these sections at the end (only when relevant):
```
✨ Suggested Improvements
[2-3 optional bullet tips]

📊 Estimated Budget Breakdown
Day 1: ₹X | Day 2: ₹X | ... | Total: ₹X

🧳 Travel Tips
[1-3 practical tips specific to the destination]
```

IMPORTANT: Do NOT change this format. Do NOT return JSON in chat responses. Write in friendly, readable markdown.
"""

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
