const mongoose = require('mongoose');

const ClassSlotSchema = new mongoose.Schema({
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
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6
  },
  startTime: {
    type: String,
    required: [true, 'Please add a start time'],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'Please add an end time'],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:MM format']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ClassSlot', ClassSlotSchema);
