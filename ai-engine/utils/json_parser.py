"""
utils/json_parser.py
────────────────────
Robust JSON extraction and parsing for LLM output.

LLMs sometimes:
  • Wrap JSON in ```json ... ``` fences.
  • Prefix the JSON with an explanation sentence.
  • Use trailing commas (invalid in standard JSON).
  • Mix single-quotes with double-quotes.

This module handles all of those cases gracefully.
"""

import json
import re
from typing import Any, Optional


# ── Internal helpers ──────────────────────────────────────────────────────────

def _strip_code_fences(text: str) -> str:
    """
    Remove ```json ... ``` or ``` ... ``` Markdown code fences if present.
    Returns the content inside the fences, or the original text unchanged.
    """
    # Match optional language specifier after the opening fence
    pattern = r"```(?:json)?\s*([\s\S]*?)```"
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text


def _extract_json_object(text: str) -> Optional[str]:
    """
    Scan *text* for the first balanced '{' ... '}' block and return it.
    Falls back to None if no balanced object is found.

    This handles cases where the LLM prefixes the JSON with a sentence.
    """
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i, ch in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    return None


def _fix_trailing_commas(text: str) -> str:
    """
    Remove trailing commas before closing braces/brackets.
    E.g.  [1, 2, 3,]  →  [1, 2, 3]
    """
    # Before ] or }
    return re.sub(r",\s*([}\]])", r"\1", text)


def _fix_single_quotes(text: str) -> str:
    """
    Naively replace single-quoted strings with double-quoted ones.
    Only applied as a last resort because it can corrupt apostrophes in text.
    """
    return text.replace("'", '"')


# ── Public API ────────────────────────────────────────────────────────────────

def extract_and_parse(raw_text: str) -> Any:
    """
    Extract and parse a JSON object from raw LLM output.

    Strategy (applied in order until one succeeds):
      1. Strip markdown code fences.
      2. Try direct json.loads on the cleaned text.
      3. Extract the first balanced JSON object from the text.
      4. Fix trailing commas, then retry.
      5. Fix single quotes, then retry.

    Parameters
    ----------
    raw_text : str
        The raw string returned by the LLM.

    Returns
    -------
    Any
        Parsed Python object (typically a dict).

    Raises
    ------
    ValueError
        When all parsing attempts fail.
    """

    if not raw_text or not raw_text.strip():
        raise ValueError("Cannot parse JSON from an empty string.")

    # Step 1: Remove markdown fences
    cleaned = _strip_code_fences(raw_text).strip()

    # Step 2: Direct parse attempt
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Step 3: Extract balanced JSON object
    json_candidate = _extract_json_object(cleaned)
    if json_candidate:
        try:
            return json.loads(json_candidate)
        except json.JSONDecodeError:
            pass

        # Step 4: Fix trailing commas
        fixed = _fix_trailing_commas(json_candidate)
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass

        # Step 5: Fix single quotes (last resort)
        fixed_sq = _fix_single_quotes(fixed)
        try:
            return json.loads(fixed_sq)
        except json.JSONDecodeError:
            pass

    # All attempts failed
    preview = raw_text[:300].replace("\n", " ")
    raise ValueError(
        f"❌ Could not parse JSON from LLM output.\n"
        f"   Preview (first 300 chars): {preview!r}\n"
        "   Tips:\n"
        "   • Lower the temperature in config.py.\n"
        "   • Check that the model was loaded correctly in Ollama."
    )
