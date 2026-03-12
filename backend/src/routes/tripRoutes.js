import express from 'express';
import { Trip, User, TripMember } from '../models/postgres/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { title, description, startDate, endDate, budget, ownerId } = req.body;
    const trip = await Trip.create({ title, description, startDate, endDate, budget, ownerId });
    res.status(201).json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id, {
      include: ['owner', 'members', 'itinerary', 'expenses']
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/invite', async (req, res) => {
  try {
    const { userId, role } = req.body;
    const trip = await Trip.findByPk(req.params.id);
    const user = await User.findByPk(userId);
    if (!trip || !user) return res.status(404).json({ error: 'Trip or User not found' });
    
    await TripMember.create({ TripId: trip.id, UserId: user.id, role: role || 'Member' });
    res.json({ message: 'User invited successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
