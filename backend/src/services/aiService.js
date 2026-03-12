import axios from 'axios';

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

/**
 * Single-turn travel assistant chat.
 *
 * @param {string} message  User message
 * @param {object} context  Optional context ({ tripId, destination })
 */
export const chatWithAgent = async (message, context = {}) => {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/api/chat`, {
      message,
      context,
    }, { timeout: 120_000 });
    return response.data;
  } catch (err) {
    console.error('AI Service Error (chatWithAgent):', err.message);
    throw new Error('AI Chat failed. Make sure Ollama is running.');
  }
};
