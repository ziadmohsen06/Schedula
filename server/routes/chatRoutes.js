const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// Fix: Check how protect is exported
const protect = authMiddleware.protect || authMiddleware;

// Check if parseChatCommand exists
const { parseChatCommand } = chatController;

console.log('Chat controller loaded:', {
  parseChatCommand: typeof parseChatCommand,
  chatControllerKeys: Object.keys(chatController)
});

router.post('/command', protect, parseChatCommand);

module.exports = router;