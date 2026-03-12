import express from 'express';
import { Place } from '../models/mongodb/Place.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const results = await Place.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    }).limit(10);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const place = await Place.create(req.body);
    res.status(201).json(place);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
