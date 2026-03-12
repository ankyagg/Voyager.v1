import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const generateItinerary = async (tripData) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/ai/plan`, tripData);
    return response.data;
  } catch (err) {
    console.error('AI Service Error:', err.message);
    throw new Error('AI Engine is currently unavailable');
  }
};

export const replanItinerary = async (currentItinerary, updateRequest) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/ai/replan`, {
      itinerary: currentItinerary,
      update: updateRequest,
    });
    return response.data;
  } catch (err) {
    console.error('AI Service Error:', err.message);
    throw new Error('AI Engine failed to replan');
  }
};

export const chatWithAgent = async (message, context) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/ai/chat`, {
      message,
      context,
    });
    return response.data;
  } catch (err) {
    console.error('AI Service Error:', err.message);
    throw new Error('AI Chat failed');
  }
};
