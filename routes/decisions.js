const express = require('express');
const Decision = require('../models/Decision');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All decision routes require the user to be logged in
router.use(authMiddleware);

// ─── GET ALL DECISIONS ──────────────────────────────────────
// GET /api/decisions
// Returns all decisions for the logged-in user
router.get('/', async (req, res) => {
  try {
    const decisions = await Decision.find({ userId: req.userId })
      .sort({ createdAt: -1 }); // Newest first
    res.json(decisions);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch decisions.' });
  }
});

// ─── GET DASHBOARD STATS ────────────────────────────────────
// GET /api/decisions/stats
// Returns summary numbers for the dashboard
router.get('/stats', async (req, res) => {
  try {
    const decisions = await Decision.find({ userId: req.userId });

    if (decisions.length === 0) {
      return res.json({
        total: 0,
        totalDebt: 0,
        avgDebt: 0,
        pendingReview: 0,
        moodBreakdown: {},
        categoryBreakdown: {},
      });
    }

    const total = decisions.length;
    const totalDebt = decisions.reduce((sum, d) => sum + d.debtScore, 0);
    const avgDebt = (totalDebt / total).toFixed(1);
    const pendingReview = decisions.filter(d => !d.reviewed).length;

    // Count how many decisions were made in each mood
    const moodBreakdown = decisions.reduce((acc, d) => {
      acc[d.mood] = (acc[d.mood] || 0) + 1;
      return acc;
    }, {});

    // Count decisions per category
    const categoryBreakdown = decisions.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + 1;
      return acc;
    }, {});

    res.json({ total, totalDebt, avgDebt, pendingReview, moodBreakdown, categoryBreakdown });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch stats.' });
  }
});

// ─── MOOD PREDICTION ────────────────────────────────────────
// POST /api/decisions/predict
// Uses past decisions to predict mood risk for today
router.post('/predict', async (req, res) => {
  try {
    const { activities, timeOfDay } = req.body;
    const decisions = await Decision.find({ userId: req.userId, reviewed: true });

    // Rule-based scoring system
    const rules = {
      'Worked out':     +2,
      'Skipped gym':    -2,
      'Good sleep':     +2,
      'Poor sleep':     -2,
      'Healthy meals':  +1,
      'Junk food':      -1,
      'Meditated':      +2,
      'Social hangout': +1,
      'Worked late':    -1,
      'Creative work':  +1,
    };

    let score = 0;
    const signals = [];

    (activities || []).forEach(activity => {
      if (rules[activity] !== undefined) {
        score += rules[activity];
        signals.push({ activity, impact: rules[activity] });
      }
    });

    if (timeOfDay === 'night') score -= 1;
    if (timeOfDay === 'morning') score += 1;

    // Historical insight: average regret score when mood was anxious + night
    let historicalWarning = null;
    if (decisions.length >= 3) {
      const nightAnxious = decisions.filter(
        d => d.timeOfDay === 'night' && d.mood === 'anxious' && d.regretScore
      );
      if (nightAnxious.length > 0) {
        const avgRegret = nightAnxious.reduce((s, d) => s + d.regretScore, 0) / nightAnxious.length;
        if (avgRegret < 3) {
          historicalWarning = `Your past ${nightAnxious.length} night-time anxious decisions averaged a regret score of ${avgRegret.toFixed(1)}/5. Consider waiting.`;
        }
      }
    }

    let predictedMood, riskLevel;
    if (score >= 4)       { predictedMood = 'Confident';       riskLevel = 'low'; }
    else if (score >= 2)  { predictedMood = 'Energised';       riskLevel = 'low'; }
    else if (score >= 0)  { predictedMood = 'Neutral';         riskLevel = 'medium'; }
    else if (score >= -2) { predictedMood = 'Tired / Low';     riskLevel = 'high'; }
    else                  { predictedMood = 'Anxious / Drained'; riskLevel = 'high'; }

    res.json({ predictedMood, riskLevel, score, signals, historicalWarning });
  } catch (err) {
    res.status(500).json({ message: 'Could not generate prediction.' });
  }
});

// ─── CREATE DECISION ────────────────────────────────────────
// POST /api/decisions
// Saves a new decision to the database
router.post('/', async (req, res) => {
  try {
    const { title, category, mood, timeOfDay, expectedOutcome, debtScore, reviewAfterDays, notes } = req.body;

    if (!title || !category || !mood || !timeOfDay) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    }

    const decision = await Decision.create({
      userId: req.userId,
      title,
      category,
      mood,
      timeOfDay,
      expectedOutcome: expectedOutcome || 'neutral',
      debtScore: debtScore || 5,
      reviewAfterDays: reviewAfterDays || 7,
      notes: notes || '',
    });

    res.status(201).json({ message: 'Decision logged!', decision });
  } catch (err) {
    console.error('Create decision error:', err);
    res.status(500).json({ message: 'Could not save decision.' });
  }
});

// ─── GET SINGLE DECISION ────────────────────────────────────
// GET /api/decisions/:id
router.get('/:id', async (req, res) => {
  try {
    const decision = await Decision.findOne({ _id: req.params.id, userId: req.userId });
    if (!decision) return res.status(404).json({ message: 'Decision not found.' });
    res.json(decision);
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch decision.' });
  }
});

// ─── UPDATE REGRET SCORE ────────────────────────────────────
// PATCH /api/decisions/:id/review
// Called when user rates how a past decision turned out
router.patch('/:id/review', async (req, res) => {
  try {
    const { regretScore } = req.body;

    if (!regretScore || regretScore < 1 || regretScore > 5) {
      return res.status(400).json({ message: 'Regret score must be between 1 and 5.' });
    }

    const decision = await Decision.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { regretScore, reviewed: true },
      { new: true } // Return the updated document
    );

    if (!decision) return res.status(404).json({ message: 'Decision not found.' });

    res.json({ message: 'Review saved!', decision });
  } catch (err) {
    res.status(500).json({ message: 'Could not save review.' });
  }
});

// ─── DELETE DECISION ────────────────────────────────────────
// DELETE /api/decisions/:id
router.delete('/:id', async (req, res) => {
  try {
    const decision = await Decision.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!decision) return res.status(404).json({ message: 'Decision not found.' });
    res.json({ message: 'Decision deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not delete decision.' });
  }
});

module.exports = router;
