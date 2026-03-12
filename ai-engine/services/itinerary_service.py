"""
services/itinerary_service.py
──────────────────────────────
Orchestration layer: glues together prompts → LLM → parser → schema.

This is the single entry-point for anything that wants an itinerary.
Future phases can swap the LLM call for an agent chain without touching
any other file.
"""

import json
from typing import Union

from llm import ollama_client
from prompts.travel_prompt import build_prompt
from utils.json_parser import extract_and_parse
from schemas.itinerary_schema import Itinerary


def generate_itinerary(user_request: str) -> Itinerary:
    """
    Full pipeline: user request → prompt → LLM → JSON → validated Itinerary.

    Parameters
    ----------
    user_request : str
        Natural language travel request from the user, e.g.
        "Plan a 4 day trip to Manali under 20000 INR".

    Returns
    -------
    Itinerary
        A validated Pydantic model containing the full day-by-day plan.

    Raises
    ------
    ConnectionError
        Ollama is not running.
    TimeoutError
        Ollama timed out.
    ValueError
        LLM response could not be parsed into valid JSON.
    pydantic.ValidationError
        Parsed JSON doesn't match the Itinerary schema.
    RuntimeError
        Any unexpected error from the LLM layer.
    """

    # ── Step 1: Build the engineered prompt ───────────────────────────────────
    print("📝  Building prompt …")
    prompt = build_prompt(user_request)

    # ── Step 2: Send prompt to Ollama ─────────────────────────────────────────
    print("🤖  Sending prompt to Ollama (this may take a moment) …")
    raw_response: str = ollama_client.generate(prompt)

    # ── Step 3: Extract & parse JSON ──────────────────────────────────────────
    print("🔍  Parsing LLM response …")
    parsed_dict: dict = extract_and_parse(raw_response)

    # ── Step 4: Validate against schema ───────────────────────────────────────
    print("✅  Validating schema …")
    itinerary = Itinerary(**parsed_dict)

    return itinerary


def generate_itinerary_as_dict(user_request: str) -> dict:
    """
    Convenience wrapper that returns a plain dict instead of a Pydantic model.
    Useful for JSON serialisation / API responses.
    """
    itinerary = generate_itinerary(user_request)
    return json.loads(itinerary.model_dump_json())
