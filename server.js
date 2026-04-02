const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const decisionRoutes = require('./routes/decisions');
const streakRoutes = require('./routes/streaks');

const app = express();

app.use(cors());
app.use(express.json());

// Health check — visiting the URL in browser shows this
app.get('/', (req, res) => {
  res.json({ message: 'Decision Debt Tracker API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/streaks', streakRoutes);

// Connect to MongoDB then start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
