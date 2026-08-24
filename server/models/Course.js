const mongoose = require('mongoose');

const GRADE_POINTS = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const CourseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true
  },
  credits: {
    type: Number,
    required: [true, 'Please add credit hours'],
    min: 0.5
  },
  grade: {
    type: String,
    enum: [...Object.keys(GRADE_POINTS), null],
    default: null
  },
  semester: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CourseSchema.statics.GRADE_POINTS = GRADE_POINTS;

module.exports = mongoose.model('Course', CourseSchema);
