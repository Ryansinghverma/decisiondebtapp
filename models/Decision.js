const mongoose = require('mongoose');

// This defines what a "Decision" looks like in the database
const decisionSchema = new mongoose.Schema(
  {
    // Which user made this decision
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['health', 'career', 'finance', 'relationships', 'personal'],
      required: true,
    },
    mood: {
      type: String,
      enum: ['confident', 'anxious', 'neutral', 'tired', 'excited'],
      required: true,
    },
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: true,
    },
    expectedOutcome: {
      type: String,
      enum: ['very-positive', 'positive', 'neutral', 'negative', 'very-negative'],
      default: 'neutral',
    },
    // Debt score: how rushed/emotional was this decision? (1-10)
    debtScore: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    // Regret score: filled in later when reviewing (1-5, 5 = great outcome)
    regretScore: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    // Whether the user has reviewed this decision yet
    reviewed: {
      type: Boolean,
      default: false,
    },
    // When should we remind the user to review this?
    reviewAfterDays: {
      type: Number,
      default: 7,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Decision', decisionSchema);
