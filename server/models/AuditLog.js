const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'register', 'task created', 'task deleted', 'task scheduled with AI', 'profile updated', 'updated daily preference']
  },
  ipAddress: {
    type: String,
    default: 'unknown'
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

module.exports = mongoose.model('AuditLog', AuditLogSchema);
