"""
main.py  ─  Voyager AI Engine  ─  Unified CLI Entry Point
──────────────────────────────────────────────────────────
Supports all three phases:

    python main.py               → Phase 2 (RAG + Weather + Agents)  [default]
    python main.py --phase1      → Phase 1 (Agents + Tools, no RAG)
    python main.py --phase0      → Phase 0 (Direct LLM, single call)
    python main.py --ingest      → Run Phase 2 data ingestion only
    python main.py --rag-debug   → Show RAG retrieval for a destination query
"""

import json
import sys
import os
import argparse

_ENGINE_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ENGINE_ROOT not in sys.path:
    sys.path.insert(0, _ENGINE_ROOT)

# ── ANSI colours ──────────────────────────────────────────────────────────────
_CYAN   = "\033[96m"
_GREEN  = "\033[92m"
_YELLOW = "\033[93m"
_RED    = "\033[91m"
_BLUE   = "\033[94m"
_RESET  = "\033[0m"
_BOLD   = "\033[1m"


def _banner(label: str) -> None:
    print(f"\n{_BOLD}{_CYAN}{'─'*60}")
    print(f"   Voyager AI Engine  --  {label}")
    print(f"{'─'*60}{_RESET}\n")


def _print_json(data: dict) -> None:
    print(f"\n{_GREEN}{json.dumps(data, indent=2, ensure_ascii=False)}{_RESET}\n")


def _get_request() -> str:
    print(f"{_YELLOW}Example requests:{_RESET}")
    print("  - Plan a 3 day trip to Goa under 15000 INR with beaches and nightlife")
    print("  - Plan a 4 day trip to Manali under 20000 INR with adventure activities")
    print("  - Plan a 5 day trip to Jaipur under 25000 INR for heritage lovers")
    print("  - Plan a 4 day trip to Kerala under 25000 INR\n")
    try:
        req = input(f"{_BOLD}Enter travel request:{_RESET} ").strip()
    except (EOFError, KeyboardInterrupt):
        print(f"\n{_YELLOW}Cancelled.{_RESET}")
        sys.exit(0)
    if not req:
        print(f"{_RED}No request entered.{_RESET}")
        sys.exit(1)
    return req


def _handle_errors(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except ConnectionError as exc:
        print(f"\n{_RED}{exc}{_RESET}")
        print(f"{_YELLOW}Fix: ollama serve{_RESET}")
        sys.exit(1)
    except TimeoutError as exc:
        print(f"\n{_RED}{exc}{_RESET}")
        sys.exit(1)
    except ValueError as exc:
        print(f"\n{_RED}{exc}{_RESET}")
        sys.exit(1)
    except Exception as exc:
        print(f"\n{_RED}Unexpected error: {exc}{_RESET}")
        sys.exit(1)


# ── Phase runners ──────────────────────────────────────────────────────────────

def run_phase2(user_request: str) -> None:
    """Phase 2 — Agentic pipeline with RAG, Weather, and Travel Tips."""
    from services.rag_service import is_rag_ready
    if not is_rag_ready():
        print(f"{_YELLOW}[INFO] Vector store is empty.")
        print(f"  Run:  python rag/ingest_data.py   to load travel knowledge.")
        print(f"  Proceeding with Phase 2 pipeline (RAG will be skipped).{_RESET}\n")

    print(f"{_BLUE}Pipeline: Planner Agent "
          "-> Tools -> Weather -> Tips -> RAG -> Itinerary Agent{_RESET}\n")
    from services.planning_service import run as plan_run
    itinerary = _handle_errors(plan_run, user_request)
    _show_result(itinerary)


def run_phase1(user_request: str) -> None:
    """Phase 1 — Agentic pipeline without RAG."""
    print(f"{_BLUE}Pipeline: Planner Agent -> Tools -> Itinerary Agent{_RESET}\n")
    # Phase 1 service — import directly to avoid the Phase 2 RAG imports
    import importlib, types
    # We reuse planning_service but we need Phase 1 behaviour.
    # Simplest: call planning_service with RAG disabled by temporarily
    # patching is_rag_ready to return False.
    from services import rag_service as _rag_svc
    _orig = _rag_svc.is_rag_ready
    _rag_svc.is_rag_ready = lambda: False          # temporarily disable RAG
    try:
        from services.planning_service import run as plan_run
        itinerary = _handle_errors(plan_run, user_request)
    finally:
        _rag_svc.is_rag_ready = _orig              # always restore
    _show_result(itinerary)


def run_phase0(user_request: str) -> None:
    """Phase 0 — Single direct LLM call."""
    print(f"{_BLUE}Pipeline: Direct LLM call (no agents, no tools){_RESET}\n")
    from services.itinerary_service import generate_itinerary
    itinerary = _handle_errors(generate_itinerary, user_request)
    _show_result(itinerary)


def _show_result(itinerary) -> None:
    print(f"\n{_BOLD}{_GREEN}Itinerary generated successfully!{_RESET}")
    print(itinerary.pretty_print())
    print(f"\n{_BOLD}Full JSON output:{_RESET}")
    _print_json(json.loads(itinerary.model_dump_json()))


def run_ingest() -> None:
    """Run Phase 2 data ingestion."""
    _banner("Phase 2 -- Data Ingestion")
    from rag.ingest_data import ingest
    count = ingest(reset=True)
    if count > 0:
        print(f"{_GREEN}Ingestion complete. {count} chunks stored in ChromaDB.{_RESET}")
    else:
        print(f"{_RED}Ingestion failed — check the data/travel_knowledge/ folder.{_RESET}")


def run_rag_debug() -> None:
    """Debug RAG retrieval for a user query."""
    _banner("Phase 2 -- RAG Debug")
    try:
        query = input("Enter destination or query to debug: ").strip()
    except (EOFError, KeyboardInterrupt):
        sys.exit(0)
    from services.rag_service import debug_retrieval, is_rag_ready
    if not is_rag_ready():
        print(f"{_RED}Vector store is empty. Run: python main.py --ingest{_RESET}")
        sys.exit(1)
    debug_retrieval(query, n=5)


# ── CLI entry point ────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Voyager AI Engine CLI")
    grp = parser.add_mutually_exclusive_group()
    grp.add_argument("--phase0",    action="store_true", help="Run Phase 0 (direct LLM)")
    grp.add_argument("--phase1",    action="store_true", help="Run Phase 1 (agents, no RAG)")
    grp.add_argument("--ingest",    action="store_true", help="Run Phase 2 data ingestion")
    grp.add_argument("--rag-debug", action="store_true", dest="rag_debug",
                     help="Debug RAG retrieval")
    args = parser.parse_args()

    if args.ingest:
        run_ingest()
        return
    if args.rag_debug:
        run_rag_debug()
        return

    if args.phase0:
        _banner("Phase 0 -- Direct LLM")
        req = _get_request()
        print()
        run_phase0(req)
    elif args.phase1:
        _banner("Phase 1 -- Agentic Pipeline")
        req = _get_request()
        print()
        run_phase1(req)
    else:
        _banner("Phase 2 -- Agentic Pipeline + RAG")
        req = _get_request()
        print()
        run_phase2(req)


if __name__ == "__main__":
    main()
