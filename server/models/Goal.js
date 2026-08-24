const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: String,
  targetDate: Date,
  completed: {
    type: Boolean,
    default: false
  }
});

const GoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a goal title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  targetDate: {
    type: Date,
    required: [true, 'Please add a target date']
  },
  milestones: [MilestoneSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Goal', GoalSchema);
