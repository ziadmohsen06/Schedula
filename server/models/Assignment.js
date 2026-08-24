const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseName: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Please add an assignment title'],
    trim: true
  },
  weightPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  submissionLink: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
