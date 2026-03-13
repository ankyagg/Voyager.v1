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
        duration    = body.context.get("duration", "")
        dates       = body.context.get("dates", "")
        saved       = body.context.get("savedPlaces", [])
        notes       = body.context.get("sharedNotes", [])
        interests   = body.context.get("participantInterests", [])
        group_prefs = body.context.get("groupPreferences", {})
        suggestions = body.context.get("suggestions", [])
        current_itin = body.context.get("currentItinerary", "")

        if destination:
            context_str = f"The user is currently planning a trip to **{destination}**."
        
        if travelers:
            participants_str = f"\n- Travelers: {travelers}"
            
        if duration or dates:
            context_str += f"\n- Duration: {duration} days ({dates})" if dates else f"\n- Duration: {duration} days"

        if current_itin and current_itin != "[]":
            context_str += f"\n- Existing Plan (Reference this to stay consistent): {current_itin}"

        if budget:
            budget_str = f"\n- Total trip budget: {budget}. Track expenses and flag if suggestions exceed this."

        if group_prefs:
            preferences_str = f"\n- Group Poll Preferences: {json.dumps(group_prefs)}"

        if saved:
            names = ", ".join(str(p) for p in saved[:10])
            saved_places_str = f"\n- Saved Places (prioritize these): [{names}]"
            
        if notes:
            val = notes if isinstance(notes, str) else json.dumps(notes)
            context_str += f"\n- Shared Notes from participants: {val}"
            
        if interests:
            val = interests if isinstance(interests, str) else json.dumps(interests)
            context_str += f"\n- Participant Interests: {val}"
            
        if suggestions:
            val = suggestions if isinstance(suggestions, str) else json.dumps(suggestions)
            context_str += f"\n- User Suggestions: {val}"

    system_prompt = f"""\
You are an intelligent AI travel planning assistant integrated into a collaborative trip planning platform.
Your role is not only to generate itineraries but to assist groups of travelers in planning trips together efficiently.

--------------------------------------------------
TRIP CONTEXT
{context_str}{budget_str}{participants_str}{preferences_str}{saved_places_str}

--------------------------------------------------
CONVERSATIONAL GUIDELINES
- IF the user asks a specific, casual question (e.g., "where to eat jalebi?", "is it raining?", "local tip for Pune"), answer it directly and concisely first.
- ONLY follow the full multi-day itinerary structure (STEP 3) if the user explicitly asks to "plan", "generate an itinerary", or requested a significant "change/update" to the trip plan.
- If answering a casual question, you can briefly mention how it could fit into the overall plan, but do NOT replace the entire shared plan unless asked.

--------------------------------------------------
PLANNING LOGIC
- COMPLETENESS: You MUST generate a plan for EACH and EVERY day requested in the Trip Context (e.g., if 7 days, generate Day 1 up to Day 7). Do NOT summarize or cut off early. It is better to be long than incomplete.
- UNINTERRUPTED: Never stop after 2 or 3 days if the request is for more. Always finish the full duration.
- MUST: incorporate specific requests from "Shared Notes" (e.g., food requests, places to visit) directly into Morning/Afternoon/Evening slots.
- BALANCE: Ensure every participant's preferences (from polls/interests) appear somewhere in the itinerary.
- GEOGRAPHY: Group nearby attractions together; avoid unrealistic travel distances.
- BUDGET: Respect the budget constraints and flag if requests exceed it.

--------------------------------------------------
FORMATTING RULES (NEATNESS)
- ANCHORING: Always start your response from "Day 1" and go sequentially. Never skip days or start mid-way (e.g., at Day 4).
- ACTIVITY TITLES: Keep them short and punchy (e.g., "Visit Gateway of India"). MAX 10 words.
- NO PARAGRAPHS: Do NOT write long descriptions. Keep the itinerary clean.
- CATEGORIZED ESTIMATE: Always include this at the very end of the markdown response.
- NO SKIPPING: If the trip is 7 days, you MUST write "Day 1", "Day 2" ... "Day 7". Do NOT say "Days 3-5: similar to above".

--------------------------------------------------
STEP 3 — ITINERARY FORMAT (Use only for full planning requests)
Always present the travel plan using this structure:

Trip Overview
- destination
- trip duration
- main travel themes

Group Preference Summary
Summarize detected interests (e.g. Adventure, Food, Relaxation) with bullet points.

Itinerary
Day N
Morning: [activity]
Afternoon: [activity]
Evening: [activity]

"How Group Preferences Were Balanced"
Explain which activities satisfy which participants (mention their names/interests from the notes).

"How Shared Notes Influenced the Plan"
Explain how participant notes directly changed the itinerary.

Total Estimated Budget: ₹X (Replace X with the exact total sum in INR for the entire trip. Include this ONLY when generating a full itinerary.)

Categorized Estimate:
- Food & Drinks: ₹F
- Transport: ₹T
- Accommodation: ₹A
- Activities: ₹E
(Ensure F+T+A+E roughly equals X)

--------------------------------------------------
STEP 4 — PLAN OPTIMIZATION (Use only for full planning requests)
After the itinerary, suggest improvements (better ordering, reduced travel time, or optional alternatives).

--------------------------------------------------
STEP 5 — PLAN MODIFICATION BEHAVIOR
If users change inputs (add destination, remove activity), intelligently update the itinerary instead of generating an entirely unrelated new plan.
Preserve useful parts of the existing plan.

IMPORTANT: Be conversational, warm, and helpful. Do NOT return JSON. Use friendly markdown.
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
