"""
prompts/planner_prompt.py
──────────────────────────
Prompt engineering for the Planner Agent.

Responsibility
--------------
Instruct the LLM to extract structured travel metadata from a free-text
user request and return a machine-readable task plan as JSON.

Design choices
--------------
* The JSON schema is inlined so the model has a concrete template.
* Preferences are optional; the model should return [] when not mentioned.
* Tasks are prescriptive strings the Planning Service maps to tools.
* Temperature is kept at 0.2 (set in config) to minimise hallucination.
"""

# ── Expected output schema shown directly in the prompt ───────────────────────
_PLANNER_SCHEMA = """\
{
  "destination": "<city or region name>",
  "duration_days": <integer>,
  "budget": "<amount and currency, e.g. 20000 INR>",
  "travel_style": "<e.g. budget, standard, luxury, adventure>",
  "preferences": ["<optional interest 1>", "<optional interest 2>"],
  "tasks": [
    "retrieve destination knowledge",
    "get attractions",
    "estimate budget breakdown",
    "generate day-wise itinerary"
  ]
}"""

# ── Prompt template ────────────────────────────────────────────────────────────
PLANNER_PROMPT_TEMPLATE = """\
You are a travel planning coordinator. A user has made a travel request.

Your job:
1. Extract the destination, trip duration, budget, and travel style from the request.
2. Extract any special preferences or interests (e.g. adventure, food, culture).
   If none are mentioned, use an empty list [].
3. Create an ordered list of internal tasks to fulfil the request based on constraints.
   Typical tasks include (use exact wording if applicable):
   - "retrieve destination knowledge"
   - "get attractions"
   - "estimate budget"
   - "get weather info"
   - "get travel tips"
   - "generate itinerary"

STRICT OUTPUT RULES:
1. Return ONLY valid JSON. No explanations, no markdown, no code fences.
2. Do NOT write anything before or after the JSON object.
3. Follow the schema below EXACTLY.
4. "duration_days" must be an integer (e.g. 4, not "4 days").

Required JSON schema:
{schema}

User travel request:
{user_request}

JSON response:"""


def build_planner_prompt(user_request: str) -> str:
    """
    Inject the user request into the planner prompt template.

    Parameters
    ----------
    user_request : str
        Natural language travel request.

    Returns
    -------
    str
        Fully-formed planner prompt.
    """
    if not user_request or not user_request.strip():
        raise ValueError("user_request must be a non-empty string.")

    return PLANNER_PROMPT_TEMPLATE.format(
        schema=_PLANNER_SCHEMA,
        user_request=user_request.strip(),
    )
