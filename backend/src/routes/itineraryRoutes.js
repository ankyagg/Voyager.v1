import express from 'express';
import { ItineraryItem } from '../models/postgres/index.js';

const router = express.Router();

router.get('/:tripId', async (req, res) => {
  try {
    const items = await ItineraryItem.findAll({ where: { TripId: req.params.tripId } });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:tripId', async (req, res) => {
  try {
    const { day, startTime, endTime, activity, placeId, cost } = req.body;
    const item = await ItineraryItem.create({ 
      TripId: req.params.tripId, 
      day, startTime, endTime, activity, placeId, cost 
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:itemId', async (req, res) => {
  try {
    const item = await ItineraryItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:itemId', async (req, res) => {
  try {
    const item = await ItineraryItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
