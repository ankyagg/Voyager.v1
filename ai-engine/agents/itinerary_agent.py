"""
agents/itinerary_agent.py
──────────────────────────
Phase 2 — Itinerary Agent (updated for RAG + weather context).

Change from Phase 1:
  generate_itinerary() now accepts two additional optional parameters:
    * rag_context  — retrieved travel knowledge string (from rag_service)
    * weather_info — weather dict (from weather_tool)

  Both parameters default to empty/None so the signature is backward-
  compatible with Phase 1 callers.
"""

import sys
import os

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from llm import ollama_client
from prompts.itinerary_prompt import build_itinerary_prompt
from utils.json_parser import extract_and_parse
from schemas.itinerary_schema import Itinerary, DayPlan


def _coerce_itinerary(raw_dict: dict, expected_days: int) -> dict:
    """
    Normalise LLM output before Pydantic validation.

    * Coerce duration_days to int.
    * Pad or trim itinerary list to match expected_days.
    * Ensure each day object has required keys.
    """
    try:
        raw_dict["duration_days"] = int(
            str(raw_dict.get("duration_days", expected_days)).split()[0]
        )
    except (ValueError, TypeError):
        raw_dict["duration_days"] = expected_days

    days = raw_dict.get("itinerary", [])
    normalised = []
    for i, day in enumerate(days, start=1):
        if isinstance(day, dict):
            normalised.append({
                "day": day.get("day", i),
                "activities": day.get("activities", ["Sightseeing", "Local cuisine"]),
            })

    while len(normalised) < expected_days:
        day_num = len(normalised) + 1
        normalised.append({
            "day": day_num,
            "activities": [
                "Morning sightseeing",
                "Local lunch",
                "Afternoon exploration",
                "Evening leisure",
            ],
        })

    raw_dict["itinerary"]     = normalised[:expected_days]
    raw_dict["duration_days"] = expected_days
    return raw_dict


def generate_itinerary(
    destination: str,
    duration_days: int,
    budget: str,
    attractions: list,
    budget_info: dict,
    preferences: list,
    rag_context: str = "",           # NEW in Phase 2
    weather_info: dict | None = None, # NEW in Phase 2
) -> Itinerary:
    """
    Generate a validated day-by-day Itinerary using the LLM.

    Parameters
    ----------
    destination   : Destination name.
    duration_days : Number of days.
    budget        : Budget constraint string.
    attractions   : List of attraction strings from attraction_tool.
    budget_info   : Budget dict from budget_tool.
    preferences   : User preferences list from TaskPlan.
    rag_context   : Retrieved travel knowledge (Phase 2). Pass "" to skip.
    weather_info  : Weather dict from weather_tool (Phase 2). Pass None to skip.

    Returns
    -------
    Itinerary
        Validated Pydantic itinerary model.
    """
    rag_label = " + RAG context" if rag_context else ""
    print(f"  Itinerary Agent: generating plan{rag_label} ...")

    # Step 1 — Build prompt (Phase 2 version includes rag + weather)
    prompt = build_itinerary_prompt(
        destination=destination,
        duration_days=duration_days,
        budget=budget,
        attractions=attractions,
        budget_info=budget_info,
        preferences=preferences,
        rag_context=rag_context,
        weather_info=weather_info,
    )

    # Step 2 — Call LLM
    raw_response = ollama_client.generate(prompt)

    # Step 3 — Parse JSON
    raw_dict = extract_and_parse(raw_response)

    # Step 4 — Normalise
    raw_dict = _coerce_itinerary(raw_dict, expected_days=duration_days)

    # Step 5 — Inject budget_estimate if missing
    if not raw_dict.get("budget_estimate"):
        raw_dict["budget_estimate"] = budget

    # Step 6 — Validate schema
    itinerary = Itinerary(**raw_dict)

    print(f"  Itinerary for {destination} ({duration_days}d) ready.")
    return itinerary
