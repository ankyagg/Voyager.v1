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


def run(user_request: str) -> Itinerary:
    """
    Execute the full Phase-2 agentic RAG planning pipeline.

    Parameters
    ----------
    user_request : str
        Natural language travel request from the user.

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

    # ── Step 1: Planner Agent ─────────────────────────────────────────────────
    _log(1, "Planner Agent — decomposing request ...")
    task_plan = planner_agent.plan(user_request)

    destination   = task_plan.destination
    duration_days = task_plan.duration_days
    budget        = task_plan.budget
    preferences   = task_plan.preferences

    # ── Step 2: destination_tool ──────────────────────────────────────────────
    _log(2, "Tool: destination_tool — fetching destination info ...")
    dest_info = destination_tool.get_destination_info(destination)
    dest_type = dest_info.get("type", "mixed")
    print(
        f"  {destination} identified as '{dest_type}' destination. "
        f"Best months: {', '.join(dest_info.get('best_months', [])[:3])}"
    )

    # ── Step 3: attraction_tool ───────────────────────────────────────────────
    _log(3, "Tool: attraction_tool — fetching top attractions ...")
    attractions = attraction_tool.get_attractions(destination, limit=8)
    print(f"  {len(attractions)} attractions found: {', '.join(attractions[:4])} ...")

    # ── Step 4: budget_tool ───────────────────────────────────────────────────
    _log(4, "Tool: budget_tool — estimating costs ...")
    budget_info = budget_tool.estimate_budget(
        destination=destination,
        duration_days=duration_days,
        budget_constraint=budget,
        destination_type=dest_type,
    )
    feasibility = "Feasible" if budget_info["is_feasible"] else "Over budget"
    print(
        f"  {feasibility} — Estimated: {budget_info['estimated_cost']} | "
        f"User budget: {budget}"
    )

    # ── Step 5: weather_tool (Phase 2) ────────────────────────────────────────
    _log(5, "Tool: weather_tool — fetching weather info ...")
    weather_info = weather_tool.get_weather(destination)
    print(
        f"  {weather_info['month']}: {weather_info['temp_c']}°C, "
        f"{weather_info['condition']}"
    )
    print(f"  Tip: {weather_info['travel_tip']}")

    # ── Step 6: travel_tip_tool (Phase 2) ─────────────────────────────────────
    _log(6, "Tool: travel_tip_tool — fetching local tips ...")
    tips = travel_tip_tool.get_travel_tips(destination, limit=4)
    for tip in tips[:2]:
        print(f"  - {tip[:80]}...")

    # ── Step 7: RAG retrieval (Phase 2) ───────────────────────────────────────
    _log(7, "RAG Service — retrieving travel knowledge ...")
    if is_rag_ready():
        rag_context = build_rag_context(destination, preferences)
        rag_chars = len(rag_context)
        print(f"  Retrieved {rag_chars} chars of knowledge context.")
    else:
        rag_context = ""
        print(
            "  Vector store is empty — run: python rag/ingest_data.py\n"
            "  Proceeding without RAG context."
        )

    # ── Step 8: Itinerary Agent ───────────────────────────────────────────────
    _log(8, "Itinerary Agent — generating day-by-day plan ...")
    itinerary = itinerary_agent.generate_itinerary(
        destination=destination,
        duration_days=duration_days,
        budget=budget,
        attractions=attractions,
        budget_info=budget_info,
        preferences=preferences,
        rag_context=rag_context,
        weather_info=weather_info,
    )

    print(f"\n[{TOTAL_STEPS}/{TOTAL_STEPS}] Pipeline complete!")
    return itinerary


def run_as_dict(user_request: str) -> dict:
    """
    Convenience wrapper — returns a plain dict for JSON serialisation.
    """
    return json.loads(run(user_request).model_dump_json())
