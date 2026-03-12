"""
schemas/task_schema.py
───────────────────────
Pydantic models for the Planner Agent's output.

The Planner decomposes a user travel request into a structured task plan
that the Planning Service then executes step-by-step.
"""

from __future__ import annotations

from typing import List
from pydantic import BaseModel, Field, field_validator


class TaskPlan(BaseModel):
    """
    Structured plan produced by the Planner Agent.

    Fields
    ------
    destination   : Extracted destination (e.g. "Manali").
    duration_days : Extracted trip length as an integer.
    budget        : Extracted budget string (e.g. "20000 INR").
    preferences   : Optional special interests ("adventure", "food", etc.).
    tasks         : Ordered list of sub-tasks the system will execute.
    """

    destination: str = Field(..., min_length=1, description="Travel destination.")
    duration_days: int = Field(..., ge=1, description="Trip length in days.")
    budget: str = Field(..., min_length=1, description="Budget constraint string.")
    preferences: List[str] = Field(
        default_factory=list,
        description="Optional list of interests / preferences.",
    )
    tasks: List[str] = Field(
        ...,
        min_length=1,
        description="Ordered list of sub-tasks to execute.",
    )

    @field_validator("tasks", mode="before")
    @classmethod
    def clean_tasks(cls, v: list) -> list:
        """Strip whitespace and drop empty task strings."""
        cleaned = [str(t).strip() for t in v if str(t).strip()]
        if not cleaned:
            raise ValueError("tasks list must contain at least one non-empty string.")
        return cleaned

    def summary(self) -> str:
        """Human-readable one-liner for logging."""
        pref = f" [{', '.join(self.preferences)}]" if self.preferences else ""
        return (
            f"📋 Plan: {self.destination} | {self.duration_days}d | "
            f"{self.budget}{pref} | {len(self.tasks)} task(s)"
        )
