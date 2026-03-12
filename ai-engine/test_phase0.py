"""Quick smoke-test for Phase-0 modules (no Ollama needed)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 1. config
from config import OLLAMA_GENERATE_ENDPOINT, OLLAMA_MODEL, REQUEST_TIMEOUT, GENERATION_OPTIONS
print("config               OK")

# 2. LLM client (import only)
from llm import ollama_client
print("llm.ollama_client    OK")

# 3. Prompt builder
from prompts.travel_prompt import build_prompt
p = build_prompt("Plan a 3 day trip to Goa under 15000 INR")
assert "Return ONLY valid JSON" in p, "Missing instruction in prompt"
print("prompts.travel_prompt OK")

# 4. JSON parser
from utils.json_parser import extract_and_parse

raw1 = '{"destination":"Goa","duration_days":3,"budget_estimate":"15000 INR","itinerary":[{"day":1,"activities":["Beach"]}]}'
r1 = extract_and_parse(raw1)
assert r1["destination"] == "Goa"

raw2 = "```json\n" + raw1 + "\n```"
r2 = extract_and_parse(raw2)
assert r2["destination"] == "Goa"

raw3 = "Here is your JSON: " + raw1
r3 = extract_and_parse(raw3)
assert r3["destination"] == "Goa"

raw4 = '{"destination":"Goa","duration_days":3,"budget_estimate":"15000 INR","itinerary":[{"day":1,"activities":["Beach",]},]}'
r4 = extract_and_parse(raw4)
assert r4["destination"] == "Goa"

print("utils.json_parser    OK (4 cases)")

# 5. Schema
from schemas.itinerary_schema import Itinerary, DayPlan
it = Itinerary(
    destination="Goa",
    duration_days=1,
    budget_estimate="15000 INR",
    itinerary=[DayPlan(day=1, activities=["Beach", "Sunset cruise"])]
)
assert "Goa" in it.pretty_print()
print("schemas.itinerary    OK")

# 6. Service import
from services import itinerary_service
print("services.itinerary   OK")

print()
print("==> All smoke-tests PASSED.")
