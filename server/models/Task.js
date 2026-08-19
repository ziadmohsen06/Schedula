const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.JWT_SECRET;

const TaskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  estimatedHours: {
    type: Number,
    default: 1
  },
  tags: [{
    type: String,
    enum: ['University', 'Work', 'Personal', 'Gym', 'Errands', 'Other'],
    default: ['Other']
  }],
  notes: [{
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  scheduledDays: [
    {
      date: Date,
      hoursPerDay: Number,
      focus: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt description before saving (skip if no key)
TaskSchema.pre('save', function() {
  if (!ENCRYPTION_KEY) return;
  if (this.isModified('description') && this.description) {
    try {
      this.description = CryptoJS.AES.encrypt(
        this.description,
        ENCRYPTION_KEY
      ).toString();
    } catch (e) {
      // encryption failed; leave description as-is
    }
  }
});

// Decrypt description after fetching (skip if no key)
TaskSchema.post('find', function(docs) {
  if (!ENCRYPTION_KEY) return;
  docs.forEach(doc => {
    if (doc.description) {
      try {
        const bytes = CryptoJS.AES.decrypt(doc.description, ENCRYPTION_KEY);
        doc.description = bytes.toString(CryptoJS.enc.Utf8) || doc.description;
      } catch (e) {
        // already decrypted or not encrypted
      }
    }
  });
});

module.exports = mongoose.model('Task', TaskSchema);