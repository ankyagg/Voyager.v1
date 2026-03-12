"""
services/planning_service.py
─────────────────────────────
Phase 2 — Updated Planning Service (RAG + Weather + Travel Tips)

Pipeline (8 steps):
  1. Planner Agent     — LLM: decompose request into TaskPlan
  2. destination_tool  — static: type, climate, best months
  3. attraction_tool   — static: top attractions list
  4. budget_tool       — static: cost estimate + breakdown
  5. weather_tool      — static: current-month weather info    [NEW Phase 2]
  6. travel_tip_tool   — static: curated local tips            [NEW Phase 2]
  7. RAG Service       — vector: retrieve relevant knowledge   [NEW Phase 2]
  8. Itinerary Agent   — LLM: build day-by-day plan with context
"""

import json
import sys
import os

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from agents import planner_agent
from agents import itinerary_agent
from tools import destination_tool, attraction_tool, budget_tool
from tools import weather_tool, travel_tip_tool     # Phase 2 new tools
from services.rag_service import build_rag_context, is_rag_ready
from schemas.itinerary_schema import Itinerary


TOTAL_STEPS = 8


def _log(step: int, msg: str) -> None:
    print(f"\n[{step}/{TOTAL_STEPS}] {msg}")


def detect_intent(user_request: str) -> str:
    """Classify the user intent: generate new or modify existing."""
    modify_keywords = ["remove", "add", "replace", "change", "update", "modify", "reduce", "increase"]
    req = user_request.lower()
    if any(kw in req for kw in modify_keywords):
        return "modify_existing_plan"
    return "generate_new_plan"


def run(user_request: str, existing_itinerary: dict | None = None) -> Itinerary:
    """
    Execute the full Phase-2 agentic RAG planning pipeline.

    Parameters
    ----------
    user_request : str
        Natural language travel request from the user.
    existing_itinerary : dict | None
        Optional existing itinerary for interactive modifications.

    Returns
    -------
    Itinerary
        Validated Pydantic itinerary model.

    Raises
    ------
    ConnectionError  — Ollama not running.
    TimeoutError     — Ollama timed out.
    ValueError       — LLM returned unparseable JSON.
    RuntimeError     — Any other LLM / HTTP error.
    """

    intent = detect_intent(user_request)
    if intent == "modify_existing_plan" and existing_itinerary:
        from services.itinerary_modifier import run_modification
        return run_modification(user_request, existing_itinerary)

    # ── Step 1: Planner Agent ─────────────────────────────────────────────────
    _log(1, "Planner Agent — decomposing request ...")
    task_plan = planner_agent.plan(user_request)

    # Extract Phase 3 fields
    destination   = task_plan.destination
    duration_days = task_plan.duration_days
    budget        = task_plan.budget
    preferences   = task_plan.preferences
    travel_style  = getattr(task_plan, "travel_style", "standard")
    task_list     = [t.lower() for t in task_plan.tasks]

    # Initialize tool data
    dest_info = {}
    dest_type = "mixed"
    attractions = []
    budget_info = {}
    weather_info = None
    rag_context = ""

    # ── Step 2: RAG retrieval (Phase 3: RAG First) ────────────────────────────
    _log(2, "RAG Service — retrieving travel knowledge ...")
    if any("knowledge" in t for t in task_list) or True: # RAG first strategy
        if is_rag_ready():
            rag_context = build_rag_context(destination, preferences)
            rag_chars = len(rag_context)
            print(f"  Retrieved {rag_chars} chars of knowledge context.")
        else:
            print("  Vector store is empty — proceeding without RAG.")

    # ── Step 3: destination_tool ──────────────────────────────────────────────
    _log(3, "Tool: destination_tool — fetching destination info ...")
    dest_info = destination_tool.get_destination_info(destination)
    dest_type = dest_info.get("type", "mixed")
    print(f"  {destination} identified as '{dest_type}' destination.")

    # ── Step 4: attraction_tool ───────────────────────────────────────────────
    _log(4, "Tool: attraction_tool — fetching top attractions ...")
    if any("attraction" in t for t in task_list):
        attractions = attraction_tool.get_attractions(destination, limit=8)
        print(f"  {len(attractions)} attractions retrieved.")
    else:
        print("  Skipped based on planner tasks.")

    # ── Step 5: budget_tool ───────────────────────────────────────────────────
    _log(5, "Tool: budget_tool — estimating costs ...")
    if any("budget" in t for t in task_list):
        budget_info = budget_tool.estimate_budget(
            destination=destination,
            duration_days=duration_days,
            budget_constraint=budget,
            destination_type=dest_type,
        )
        feasibility = "Feasible" if budget_info["is_feasible"] else "Over budget"
        print(f"  {feasibility} — Estimated: {budget_info['estimated_cost']}")
    else:
        print("  Skipped based on planner tasks.")

    # ── Step 6: weather_tool ──────────────────────────────────────────────────
    _log(6, "Tool: weather_tool — fetching weather info ...")
    if any("weather" in t for t in task_list):
        weather_info = weather_tool.get_weather(destination)
        print(f"  {weather_info['month']}: {weather_info['temp_c']}°C, {weather_info['condition']}")
    else:
        print("  Skipped based on planner tasks.")

    # ── Step 7: travel_tip_tool ───────────────────────────────────────────────
    _log(7, "Tool: travel_tip_tool — fetching local tips ...")
    if any("tip" in t for t in task_list):
        tips = travel_tip_tool.get_travel_tips(destination, limit=4)
        print(f"  Added {len(tips)} tips.")
    else:
        print("  Skipped based on planner tasks.")

    # ── Step 8: Itinerary Agent ───────────────────────────────────────────────
    _log(8, "Itinerary Agent — generating constraint-aware day-by-day plan ...")
    itinerary = itinerary_agent.generate_itinerary(
        destination=destination,
        duration_days=duration_days,
        budget=budget,
        attractions=attractions,
        budget_info=budget_info,
        preferences=preferences,
        travel_style=travel_style,
        rag_context=rag_context,
        weather_info=weather_info,
    )

    print(f"\n[{TOTAL_STEPS}/{TOTAL_STEPS}] Pipeline complete!")
    return itinerary


def run_as_dict(user_request: str, existing_itinerary: dict | None = None) -> dict:
    """
    Convenience wrapper — returns a plain dict for JSON serialisation.
    """
    return json.loads(run(user_request, existing_itinerary).model_dump_json())
