const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  userAgent: {
    type: String,
    default: ''
  },
  device: {
    type: String,
    default: 'Unknown device'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  revoked: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Session', SessionSchema);
