const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a habit name'],
    trim: true
  },
  emoji: {
    type: String,
    default: '✅'
  },
  // Stored as YYYY-MM-DD strings for simple dedup/lookup.
  completedDates: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Habit', HabitSchema);
