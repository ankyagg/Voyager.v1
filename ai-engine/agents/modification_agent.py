"""
agents/modification_agent.py
─────────────────────────────
Phase 4 — Modification Agent

Classifies structured modification instructions from a raw user request.
"""

import sys
import os

_ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

from pydantic import BaseModel, Field
from llm import ollama_client
from utils.json_parser import extract_and_parse

class ModificationInstruction(BaseModel):
    operation: str = Field(..., description="Type of operation: 'remove', 'add', 'replace', or 'adjust_budget'")
    target_day: int = Field(default=0, description="The day to modify. 0 if it applies to the entire trip.")
    activity: str = Field(default="", description="The specific activity to add, remove, or replace.")
    details: str = Field(default="", description="Any additional context provided by the user.")

_MODIFICATION_SCHEMA = """\
{
  "operation": "remove | add | replace | adjust_budget",
  "target_day": <integer, 0 for overall>,
  "activity": "<activity name, if applicable>",
  "details": "<extra info>"
}"""

_PROMPT_TEMPLATE = """\
You are an expert travel itinerary modifier.
A user wants to modify their existing travel itinerary.

Determine the exact modification instruction based on their request.

STRICT OUTPUT RULES:
1. Return ONLY valid JSON. No markdown fences.
2. Follow the required schema exactly.
3. The operation MUST be one of: "remove", "add", "replace", "adjust_budget".
4. If the request doesn't specify a day, guess the best day, or use 0 for overall changes.

Required JSON schema:
{schema}

User request: "{request}"

JSON response:"""

def parse_modification(user_request: str) -> ModificationInstruction:
    """
    Parse a natural language modification request into a structured JSON instruction.
    """
    print("  🔍  Modification Agent: interpreting request ...")
    prompt = _PROMPT_TEMPLATE.format(schema=_MODIFICATION_SCHEMA, request=user_request)
    
    raw_response = ollama_client.generate(prompt)
    raw_dict = extract_and_parse(raw_response)
    
    # Coerce fallback
    if raw_dict.get("operation") not in ["remove", "add", "replace", "adjust_budget"]:
        raw_dict["operation"] = "replace"
        
    if not isinstance(raw_dict.get("target_day"), int):
        try:
            raw_dict["target_day"] = int(str(raw_dict.get("target_day", 0)).strip())
        except ValueError:
            raw_dict["target_day"] = 0
            
    instruction = ModificationInstruction(**raw_dict)
    print(f"  ✅  Instruction: {instruction.operation.upper()} | Day {instruction.target_day} | {instruction.activity}")
    return instruction
