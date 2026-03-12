"""
agents/planner_agent.py
────────────────────────
Phase 1 — Planner Agent

Responsibility
--------------
Analyse a free-text user travel request, extract structured metadata
(destination, duration, budget, preferences), and produce an ordered
task list that the Planning Service will execute.

Architecture note
-----------------
The agent is a thin wrapper: it builds a prompt, calls the LLM, parses
the JSON response, and validates it against TaskPlan.  No planning logic
lives here — that belongs in planning_service.py.
"""

import sys
import os

# Ensure the engine root is resolvable when this module is imported directly
_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from llm import ollama_client
from prompts.planner_prompt import build_planner_prompt
from utils.json_parser import extract_and_parse
from schemas.task_schema import TaskPlan


# ── Default task list inserted when LLM returns an incomplete tasks field ──────
_DEFAULT_TASKS = [
    "retrieve destination knowledge",
    "get attractions",
    "estimate budget",
    "get weather info",
    "get travel tips",
    "generate itinerary",
]


def _coerce_task_plan(raw_dict: dict) -> dict:
    """
    Normalise common LLM quirks before creating a TaskPlan:

    * Ensure 'tasks' contains the four standard strings (merge with defaults).
    * Coerce 'duration_days' to int if the model returned a string.
    * Ensure 'preferences' is a list.
    """
    # Coerce duration_days
    if "duration_days" in raw_dict:
        try:
            raw_dict["duration_days"] = int(
                str(raw_dict["duration_days"]).split()[0]
            )
        except (ValueError, TypeError):
            raw_dict["duration_days"] = 2  # safe fallback

    # Ensure preferences is a list
    if "preferences" not in raw_dict or not isinstance(raw_dict["preferences"], list):
        raw_dict["preferences"] = []

    # Ensure travel_style exists
    if "travel_style" not in raw_dict or not isinstance(raw_dict["travel_style"], str):
        raw_dict["travel_style"] = "standard"

    # Ensure tasks contains at least the four standard strings
    existing_tasks = [str(t).lower().strip() for t in raw_dict.get("tasks", [])]
    merged = list(raw_dict.get("tasks", []))
    for default in _DEFAULT_TASKS:
        if not any(default in et for et in existing_tasks):
            merged.append(default)
    raw_dict["tasks"] = merged or _DEFAULT_TASKS

    return raw_dict


def plan(user_request: str) -> TaskPlan:
    """
    Analyse *user_request* and return a structured TaskPlan.

    Parameters
    ----------
    user_request : str
        Natural language travel request.

    Returns
    -------
    TaskPlan
        Validated Pydantic model with destination, days, budget, and tasks.

    Raises
    ------
    ConnectionError, TimeoutError, RuntimeError
        Propagated from ollama_client on network / server errors.
    ValueError
        If the LLM response cannot be parsed into valid JSON.
    pydantic.ValidationError
        If parsed data doesn't match TaskPlan schema.
    """
    print("  🗺️  Planner Agent: analysing request …")

    # Step 1 — Build prompt
    prompt = build_planner_prompt(user_request)

    # Step 2 — Call LLM
    raw_response = ollama_client.generate(prompt)

    # Step 3 — Parse JSON
    raw_dict = extract_and_parse(raw_response)

    # Step 4 — Normalise quirks
    raw_dict = _coerce_task_plan(raw_dict)

    # Step 5 — Validate schema
    task_plan = TaskPlan(**raw_dict)

    print(f"  ✅  {task_plan.summary()}")
    return task_plan
