import express from 'express';
import { generateItinerary, chatWithAgent } from '../services/aiService.js';

const router = express.Router();

router.post('/generate-itinerary', async (req, res) => {
  try {
    const { city, days, budget, preferences, tripId, group_preferences, accepted_suggestions, participants_count } = req.body;
    const plan = await generateItinerary({ 
      city, days, budget, preferences, tripId, 
      group_preferences, accepted_suggestions, participants_count 
    });
    res.json(plan);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    const response = await chatWithAgent(message, context);
    res.json(response);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
