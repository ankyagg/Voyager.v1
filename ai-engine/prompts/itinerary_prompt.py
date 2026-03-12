"""
prompts/itinerary_prompt.py
────────────────────────────
Prompt engineering for the Itinerary Agent (updated for Phase 2 RAG).

Phase 2 change: an optional `rag_context` block is injected between the
tool results and the task instructions.  When the vector store is empty
(or RAG is disabled), the block is omitted transparently — the prompt
degrades gracefully to the Phase 1 format.
"""

import json as _json

# ── Output schema ──────────────────────────────────────────────────────────────
_ITINERARY_SCHEMA = """\
{
  "destination": "<city or region>",
  "duration_days": <integer>,
  "budget_estimate": "<amount and currency>",
  "itinerary": [
    {
      "day": 1,
      "activities": ["<activity 1>", "<activity 2>", "<activity 3>"]
    }
  ]
}"""

# ── Prompt template (with RAG context block) ───────────────────────────────────
# {rag_context_block} is the only new placeholder.
# When RAG is available it expands to a multi-line knowledge section;
# when RAG is unavailable it expands to an empty string.
ITINERARY_PROMPT_TEMPLATE = """\
You are an expert travel itinerary planner.

Trip details:
- Destination    : {destination}
- Duration       : {duration_days} days
- Budget         : {budget}
- Interests      : {preferences}

Available attractions:
{attractions}

Budget breakdown:
{budget_info}
{rag_context_block}
Weather & tips:
{weather_summary}

Your task:
- Create a realistic day-by-day itinerary for exactly {duration_days} days.
- Each day must have 3 to 5 activities drawn from the attractions and knowledge above.
- Use the retrieved travel knowledge (if provided) to include authentic local experiences.
- Day 1 should include arrival and orientation. Last day should include departure.
- Respect the budget and include practical activities matching user interests.
- Do NOT repeat the same attraction across multiple days.

STRICT OUTPUT RULES:
1. Return ONLY valid JSON. No explanations, no markdown, no code fences.
2. Do NOT write anything before or after the JSON object.
3. "duration_days" must be an integer.
4. "itinerary" must have exactly {duration_days} day objects.
5. Follow the schema below EXACTLY.

Required JSON schema:
{schema}

JSON response:"""


def build_itinerary_prompt(
    destination: str,
    duration_days: int,
    budget: str,
    attractions: list,
    budget_info: dict,
    preferences: list,
    rag_context: str = "",
    weather_info: dict | None = None,
) -> str:
    """
    Build the itinerary generation prompt including optional RAG context.

    Parameters
    ----------
    destination   : City / region name.
    duration_days : Number of days.
    budget        : Budget constraint string.
    attractions   : List of attraction strings from attraction_tool.
    budget_info   : Budget breakdown dict from budget_tool.
    preferences   : User preference list.
    rag_context   : Retrieved knowledge string from rag_service (may be "").
    weather_info  : Weather dict from weather_tool (may be None).

    Returns
    -------
    str
        Fully-formed itinerary prompt.
    """
    pref_str = ", ".join(preferences) if preferences else "general tourism"

    # ── RAG context block ──────────────────────────────────────────────────────
    # Only inject if we actually have retrieved content.
    if rag_context and rag_context.strip():
        rag_block = f"\nRetrieved travel knowledge:\n{rag_context}\n"
    else:
        rag_block = ""

    # ── Weather summary ────────────────────────────────────────────────────────
    if weather_info:
        weather_summary = (
            f"Temperature: {weather_info.get('temp_c', 'N/A')}°C | "
            f"Condition: {weather_info.get('condition', 'N/A')} | "
            f"Tip: {weather_info.get('travel_tip', '')}"
        )
    else:
        weather_summary = "Not available."

    return ITINERARY_PROMPT_TEMPLATE.format(
        destination=destination,
        duration_days=duration_days,
        budget=budget,
        preferences=pref_str,
        attractions=_json.dumps(attractions, ensure_ascii=False),
        budget_info=_json.dumps(budget_info, ensure_ascii=False, indent=2),
        rag_context_block=rag_block,
        weather_summary=weather_summary,
        schema=_ITINERARY_SCHEMA,
    )
