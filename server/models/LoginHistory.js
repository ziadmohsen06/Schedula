const mongoose = require('mongoose');

const LoginHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  device: {
    type: String,
    default: 'Unknown device'
  },
  warning: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LoginHistory', LoginHistorySchema);
