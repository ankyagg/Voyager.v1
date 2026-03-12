import express from 'express';
import { BudgetItem, Trip } from '../models/postgres/index.js';

const router = express.Router();

router.get('/:tripId', async (req, res) => {
  try {
    const expenses = await BudgetItem.findAll({ where: { TripId: req.params.tripId } });
    const trip = await Trip.findByPk(req.params.tripId);
    
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    const balance = trip ? trip.budget - totalSpent : 0;

    res.json({ expenses, totalSpent, balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:tripId', async (req, res) => {
  try {
    const { category, amount, description } = req.body;
    const expense = await BudgetItem.create({ 
      TripId: req.params.tripId, 
      category, amount, description 
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
