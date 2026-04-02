const mongoose = require('mongoose');

// Tracks a user's habit streaks (e.g. gym, meditation, sleep)
const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    habitName: {
      type: String,
      required: true,
      trim: true,
    },
    // Emoji icon to display (e.g. "🏋️")
    icon: {
      type: String,
      default: '⭐',
    },
    // Current streak count in days
    currentStreak: {
      type: Number,
      default: 0,
    },
    // Longest streak ever for this habit
    longestStreak: {
      type: Number,
      default: 0,
    },
    // Array of dates the habit was completed (stored as date strings "YYYY-MM-DD")
    completedDates: {
      type: [String],
      default: [],
    },
    // Last date the habit was logged
    lastLoggedDate: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Streak', streakSchema);
