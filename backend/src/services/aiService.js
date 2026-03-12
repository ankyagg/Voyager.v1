import axios from 'axios';
import { buildDataContext } from './dataHelper.js';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

/**
 * Call the AI engine's Phase-2 agentic pipeline.
 * Sends a natural-language request string built from trip fields.
 *
 * @param {object} tripData  { city, days, budget, preferences }
 * @returns {Promise<object>} Structured itinerary JSON from the AI engine
 */
export const generateItinerary = async (tripData) => {
  const { city, days, budget, preferences } = tripData;

  // Build the natural-language request the AI engine expects
  const prefStr = Array.isArray(preferences) && preferences.length
    ? `with ${preferences.join(', ')}`
    : '';
  const request = `Plan a ${days} day trip to ${city} under ${budget} INR ${prefStr}`.trim();

  try {
    const response = await axios.post(`${AI_ENGINE_URL}/api/plan`, { request }, {
      timeout: 180_000, // 3 min — LLM can be slow on first call
    });
    return response.data;
  } catch (err) {
    console.error('AI Service Error (generateItinerary):', err.message);
    throw new Error('AI Engine is currently unavailable. Make sure Ollama is running.');
  }
};

/**
 * Replan an existing itinerary with a modification request.
 *
 * @param {object} currentItinerary  Existing itinerary JSON
 * @param {string} updateRequest     Natural-language change request
 */
export const replanItinerary = async (currentItinerary, updateRequest) => {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/api/replan`, {
      itinerary: currentItinerary,
      update: updateRequest,
    }, { timeout: 180_000 });
    return response.data;
  } catch (err) {
    console.error('AI Service Error (replanItinerary):', err.message);
    throw new Error('AI Engine failed to replan. Make sure Ollama is running.');
  }
};

// ── City extractor — handles casual queries like "date idea in mumbai" ────────
const CITY_PATTERNS = [
  // Explicit travel/plan queries: "plan a trip to Mumbai", "itinerary for Goa"
  /(?:trip|itinerary|plan|visit|travel|explore)\s+(?:to|for|in|around)\s+([a-z][a-z\s]+?)(?:\.|,|\n|\s(?:in|for|with)|$)/i,
  // Casual queries: "date in mumbai", "eat in bangalore", "roam with friend in delhi"
  /(?:in|around|at|near|within)\s+([a-z][a-z\s]+?)(?:\?|\.|,|\n|$)/i,
  // "for X days in City"
  /\d+\s*(?:day|days|night|nights)\s*(?:in|at|around)?\s+([a-z][a-z\s]+?)(?:\.|,|\n|$)/i,
  // fallback: first capitalised word
  /\b([A-Z][a-z]{3,})\b/,
];

function extractCityFromMessage(message) {
  for (const pattern of CITY_PATTERNS) {
    const m = message.match(pattern);
    if (m) {
      const candidate = m[1].trim().split(',')[0].trim();
      // Filter out common non-city words that might match
      const stopWords = new Set(['my', 'me', 'us', 'we', 'some', 'the', 'this', 'that', 'there', 'here', 'now', 'you', 'your', 'our', 'friends', 'friend', 'date', 'food', 'idea', 'ideas', 'suggest', 'nice', 'best']);
      if (!stopWords.has(candidate.toLowerCase()) && candidate.length > 2) {
        return candidate;
      }
    }
  }
  return null;
}

/**
 * Single-turn travel assistant chat — now enriched with real restaurant
 * and hotel data from the Zomato + Hotels datasets.
 *
 * @param {string} message  User message
 * @param {object} context  Optional context ({ tripId, destination })
 */
export const chatWithAgent = async (message, context = {}) => {
  try {
    // 1. Figure out the destination from the message or context
    const city = context?.destination || extractCityFromMessage(message);

    // 2. Detect query mode: food-only, hotel-only, or full itinerary
    const msgLower = message.toLowerCase();
    const isFoodQuery = /\b(eat|food|restaurant|cafe|dinner|lunch|breakfast|snack|biryani|pizza|date\s*idea|roam|hangout|friend|street\s*food|drink|bar|pub|where.*eat|what.*eat)\b/.test(msgLower);
    const isHotelQuery = /\b(stay|hotel|hostel|accommodation|check.?in|where.*stay|book.*room|room)\b/.test(msgLower);
    const mode = isFoodQuery && !isHotelQuery ? 'food' : isHotelQuery && !isFoodQuery ? 'hotel' : 'all';

    // 3. Build a real-data context block (empty string if city not in dataset)
    const dataContext = city ? buildDataContext(city, mode) : '';


    if (dataContext && city) {
      console.log(`📊 Injecting Zomato+Hotels data for city: "${city}"`);
    }

    // 3. Enrich the user message with the data block so Ollama uses real names
    const enrichedMessage = dataContext
      ? `${message}${dataContext}\nPlease use the restaurants and hotels listed above (by their real names) when recommending places to eat and stay in your itinerary plan.`
      : message;

    const response = await axios.post(`${AI_ENGINE_URL}/api/chat`, {
      message: enrichedMessage,
      context,
    }, { timeout: 120_000 });

    return response.data;
  } catch (err) {
    console.error('AI Service Error (chatWithAgent):', err.message);
    throw new Error('AI Chat failed. Make sure Ollama is running.');
  }
};

