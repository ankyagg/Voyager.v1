"""
schemas/itinerary_schema.py
───────────────────────────
Pydantic models that represent a validated travel itinerary.

Why Pydantic?
-------------
* Provides automatic type coercion (e.g. "3" → 3 for integers).
* Gives clear, readable validation errors when the LLM produces
  a structurally wrong response.
* Acts as self-documenting contracts — future agents can import these
  schemas directly rather than dealing with raw dicts.
"""

from __future__ import annotations

from typing import List
from pydantic import BaseModel, Field, field_validator


class DayPlan(BaseModel):
    """A single day in the itinerary."""

    day: int = Field(..., ge=1, description="Day number (1-indexed).")
    activities: List[str] = Field(
        ...,
        min_length=1,
        description="List of activities planned for this day.",
    )

    @field_validator("activities", mode="before")
    @classmethod
    def ensure_non_empty_strings(cls, v: list) -> list:
        """Strip whitespace and drop empty strings from activities."""
        cleaned = [str(item).strip() for item in v if str(item).strip()]
        if not cleaned:
            raise ValueError("activities list must contain at least one non-empty string.")
        return cleaned


class Itinerary(BaseModel):
    """
    Root schema for a complete travel itinerary as returned by the LLM.

    Fields
    ------
    destination     : Name of the city / region.
    duration_days   : Total number of days (must match len(itinerary)).
    budget_estimate : Human-readable budget string (e.g. "20000 INR").
    itinerary       : Ordered list of DayPlan objects, one per day.
    """

    destination: str = Field(..., min_length=1, description="Travel destination.")
    duration_days: int = Field(..., ge=1, description="Total trip duration in days.")
    budget_estimate: str = Field(..., min_length=1, description="Estimated total budget.")
    itinerary: List[DayPlan] = Field(
        ...,
        min_length=1,
        description="Day-by-day breakdown of activities.",
    )

    @field_validator("itinerary", mode="after")
    @classmethod
    def days_must_match_duration(cls, v: List[DayPlan], info) -> List[DayPlan]:
        """
        Soft-check: warn if the number of DayPlan objects doesn't match
        duration_days. We don't hard-fail here to stay flexible with LLM
        output — the caller can decide.
        """
        duration = info.data.get("duration_days")
        if duration is not None and len(v) != duration:
            # Log a warning rather than raising — the data is still useful.
            import warnings
            warnings.warn(
                f"itinerary has {len(v)} day(s) but duration_days={duration}. "
                "The LLM may have miscounted; please verify.",
                UserWarning,
                stacklevel=2,
            )
        return v

    def pretty_print(self) -> str:
        """Return a human-readable summary of the itinerary."""
        lines = [
            f"\n🌍  Destination   : {self.destination}",
            f"📅  Duration      : {self.duration_days} day(s)",
            f"💰  Budget        : {self.budget_estimate}",
            "─" * 50,
        ]
        for day in self.itinerary:
            lines.append(f"\n  Day {day.day}:")
            for idx, act in enumerate(day.activities, start=1):
                lines.append(f"    {idx}. {act}")
        return "\n".join(lines)
