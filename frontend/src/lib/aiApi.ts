/**
 * frontend/src/lib/aiApi.ts
 * ──────────────────────────
 * Typed fetch wrapper for all AI backend calls.
 * Frontend components should ONLY import from here — never call
 * localhost:5000 or localhost:8000 directly.
 *
 * All calls go through the Node.js backend (port 5000) which proxies to
 * the AI engine. This keeps the AI engine port hidden from the browser.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// ── Request types ──────────────────────────────────────────────────────────────

export interface GenerateItineraryRequest {
  city: string;
  days: number;
  budget: string;         // e.g. "20000 INR"
  preferences?: string[]; // e.g. ["beach", "nightlife"]
  tripId?: string;        // Firestore trip doc ID for contextual storage
  group_preferences?: Record<string, number>;
  accepted_suggestions?: string[];
  participants_count?: number;
}

export interface ChatRequest {
  message: string;
  context?: {
    tripId?: string;
    destination?: string;
    travelers?: string;
    budget?: string;
    savedPlaces?: number[];
  };
}

// ── Response types (mirrors AI engine Itinerary schema) ───────────────────────

export interface DayPlan {
  day: number;
  activities: string[];
}

export interface ItineraryResponse {
  destination: string;
  duration_days: number;
  budget_estimate: string;
  itinerary: DayPlan[];
}

export interface ChatResponse {
  reply: string;
}

// ── API functions ──────────────────────────────────────────────────────────────

/**
 * Call the AI engine's full 8-step agentic pipeline to generate an itinerary.
 * Backend endpoint: POST /api/ai/generate-itinerary
 * AI engine: POST /api/plan
 */
export async function generateAIItinerary(
  params: GenerateItineraryRequest
): Promise<ItineraryResponse> {
  const res = await fetch(`${BACKEND_URL}/api/ai/generate-itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `AI engine error (${res.status})`);
  }

  return res.json() as Promise<ItineraryResponse>;
}

/**
 * Send a chat message to the AI travel assistant.
 * Backend endpoint: POST /api/ai/chat
 * AI engine: POST /api/chat
 */
export async function chatWithAI(params: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Chat error (${res.status})`);
  }

  return res.json() as Promise<ChatResponse>;
}

/**
 * Check if the AI engine backend is reachable.
 * Returns true if /health responds with status ok.
 */
export async function checkAIHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
