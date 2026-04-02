const express = require('express');
const Streak = require('../models/Streak');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ─── GET ALL STREAKS ────────────────────────────────────────
// GET /api/streaks
router.get('/', async (req, res) => {
  try {
    const streaks = await Streak.find({ userId: req.userId }).sort({ currentStreak: -1 });
    res.json(streaks);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch streaks.' });
  }
});

// ─── CREATE A NEW HABIT ─────────────────────────────────────
// POST /api/streaks
router.post('/', async (req, res) => {
  try {
    const { habitName, icon } = req.body;
    if (!habitName) return res.status(400).json({ message: 'Habit name is required.' });

    const streak = await Streak.create({
      userId: req.userId,
      habitName,
      icon: icon || '⭐',
    });

    res.status(201).json({ message: 'Habit created!', streak });
  } catch (err) {
    res.status(500).json({ message: 'Could not create habit.' });
  }
});

// ─── LOG HABIT FOR TODAY ─────────────────────────────────────
// POST /api/streaks/:id/log
// Marks a habit as done today and updates the streak count
router.post('/:id/log', async (req, res) => {
  try {
    const streak = await Streak.findOne({ _id: req.params.id, userId: req.userId });
    if (!streak) return res.status(404).json({ message: 'Habit not found.' });

    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Don't double-count if already logged today
    if (streak.completedDates.includes(today)) {
      return res.status(400).json({ message: 'Already logged for today!' });
    }

    // Check if yesterday was logged — if yes, continue streak; if no, reset to 1
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const continuingStreak = streak.lastLoggedDate === yesterdayStr;
    const newStreak = continuingStreak ? streak.currentStreak + 1 : 1;

    streak.completedDates.push(today);
    streak.lastLoggedDate = today;
    streak.currentStreak = newStreak;
    streak.longestStreak = Math.max(streak.longestStreak, newStreak);

    await streak.save();

    res.json({
      message: continuingStreak
        ? `Streak extended to ${newStreak} days!`
        : 'Habit logged! New streak started.',
      streak,
    });
  } catch (err) {
    res.status(500).json({ message: 'Could not log habit.' });
  }
});

// ─── DELETE A HABIT ─────────────────────────────────────────
// DELETE /api/streaks/:id
router.delete('/:id', async (req, res) => {
  try {
    const streak = await Streak.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!streak) return res.status(404).json({ message: 'Habit not found.' });
    res.json({ message: 'Habit deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete habit.' });
  }
});

module.exports = router;
