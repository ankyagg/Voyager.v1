"""
prompts/travel_prompt.py
────────────────────────
Prompt engineering for the travel itinerary generation task.

Design choices
--------------
* The prompt strongly instructs the model to return ONLY valid JSON.
* The JSON schema is inlined so the model has a concrete template to fill.
* Temperature is kept low (set in config) to reduce hallucinated structure.
* The user's natural-language request is injected at the end so the model
  reads the schema *before* the task — this improves schema adherence.
"""

# ── Schema example shown directly in the prompt ──────────────────────────────
# This acts as a "few-shot" structural hint without a full example pair.
_JSON_SCHEMA_EXAMPLE = """\
{
  "destination": "<city or region>",
  "duration_days": <integer>,
  "budget_estimate": "<amount and currency, e.g. 20000 INR>",
  "itinerary": [
    {
      "day": 1,
      "activities": ["<activity 1>", "<activity 2>", "..."]
    }
  ]
}"""

# ── Base prompt template ───────────────────────────────────────────────────────
# {user_request} is the only placeholder — filled by itinerary_service.py
TRAVEL_ITINERARY_PROMPT_TEMPLATE = """\
You are an expert travel planner. A user has given you a travel request.

Your task:
- Analyse the user's request carefully.
- Generate a complete day-by-day travel itinerary.
- Each day must contain 3–5 activities.
- Respect the budget and duration mentioned in the request.
- Suggest realistic, popular activities for the destination.

STRICT OUTPUT RULES:
1. Return ONLY valid JSON. Do not include explanations, markdown, or code fences.
2. Do NOT write anything before or after the JSON object.
3. Follow EXACTLY the schema shown below.
4. "duration_days" must be an integer (e.g. 3, not "3 days").
5. "itinerary" must have exactly as many objects as duration_days.

Required JSON schema:
{schema}

User travel request:
{user_request}

JSON response:"""


def build_prompt(user_request: str) -> str:
    """
    Inject the user's free-text travel request into the prompt template.

    Parameters
    ----------
    user_request : str
        Natural language travel request, e.g.
        "Plan a 3 day trip to Goa under 15000 INR".

    Returns
    -------
    str
        A fully-formed prompt string ready to be sent to the LLM.
    """
    if not user_request or not user_request.strip():
        raise ValueError("user_request must be a non-empty string.")

    return TRAVEL_ITINERARY_PROMPT_TEMPLATE.format(
        schema=_JSON_SCHEMA_EXAMPLE,
        user_request=user_request.strip(),
    )
