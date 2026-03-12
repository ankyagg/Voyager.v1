import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

results = []

def check(name, fn):
    try:
        fn()
        results.append(("PASS", name))
        print(f"  PASS  {name}")
    except Exception as e:
        results.append(("FAIL", name, str(e)))
        print(f"  FAIL  {name}: {e}")

def t_config():
    from config import OLLAMA_GENERATE_ENDPOINT, OLLAMA_MODEL
    assert "11434" in OLLAMA_GENERATE_ENDPOINT

def t_task_schema():
    from schemas.task_schema import TaskPlan
    tp = TaskPlan(destination="Goa", duration_days=3, budget="15000 INR", preferences=[],
                  tasks=["find destination details","find top attractions","estimate budget breakdown","generate day-wise itinerary"])
    assert tp.destination == "Goa"

def t_itinerary_schema():
    import warnings
    from schemas.itinerary_schema import Itinerary, DayPlan
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        it = Itinerary(destination="Goa", duration_days=1, budget_estimate="15000 INR",
                       itinerary=[DayPlan(day=1, activities=["Beach"])])
    assert it.destination == "Goa"

def t_planner_prompt():
    from prompts.planner_prompt import build_planner_prompt
    pp = build_planner_prompt("Plan 4 days in Manali under 20000 INR")
    assert "valid JSON" in pp

def t_itinerary_prompt():
    from prompts.itinerary_prompt import build_itinerary_prompt
    ip = build_itinerary_prompt("Manali", 4, "20000 INR",
                                 ["Solang Valley", "Rohtang Pass"],
                                 {"estimated_cost": "18000 INR", "breakdown": {}},
                                 ["adventure"])
    assert "Manali" in ip and "Solang" in ip

def t_destination_tool():
    from tools.destination_tool import get_destination_info
    d = get_destination_info("Goa")
    assert d["type"] == "beach"
    d2 = get_destination_info("Pondicherry")
    assert "destination" in d2

def t_attraction_tool():
    from tools.attraction_tool import get_attractions
    a = get_attractions("Goa", limit=5)
    assert len(a) == 5 and "Baga Beach" in a

def t_budget_tool():
    from tools.budget_tool import estimate_budget
    b = estimate_budget("Goa", 3, "15000 INR", destination_type="beach")
    assert b["breakdown"]["stay"] == "7500"
    assert b["is_feasible"] is True
    b2 = estimate_budget("Manali", 10, "5000 INR", destination_type="mountain")
    assert b2["is_feasible"] is False

def t_json_parser():
    from utils.json_parser import extract_and_parse
    r = extract_and_parse('{"destination":"X","duration_days":1}')
    assert r["destination"] == "X"

def t_planner_coercion():
    from agents.planner_agent import _coerce_task_plan
    c = _coerce_task_plan({"destination": "Jaipur", "duration_days": "5 days",
                            "budget": "25000 INR", "tasks": []})
    assert c["duration_days"] == 5
    assert len(c["tasks"]) >= 4

def t_itinerary_coercion():
    from agents.itinerary_agent import _coerce_itinerary
    ci = _coerce_itinerary(
        {"destination": "Goa", "duration_days": 3, "budget_estimate": "15k",
         "itinerary": [{"day": 1, "activities": ["Arrival"]}]},
        expected_days=3)
    assert len(ci["itinerary"]) == 3

check("config", t_config)
check("task_schema", t_task_schema)
check("itinerary_schema", t_itinerary_schema)
check("planner_prompt", t_planner_prompt)
check("itinerary_prompt", t_itinerary_prompt)
check("destination_tool", t_destination_tool)
check("attraction_tool", t_attraction_tool)
check("budget_tool", t_budget_tool)
check("json_parser", t_json_parser)
check("planner_coercion", t_planner_coercion)
check("itinerary_coercion", t_itinerary_coercion)

failed = [r for r in results if r[0] == "FAIL"]
print()
if failed:
    print(f"FAILED: {len(failed)} test(s)")
    sys.exit(1)
else:
    print(f"ALL {len(results)} PHASE-1 CHECKS PASSED")
