const express = require('express');
const router = express.Router();
const { parseChatCommand } = require('../controllers/chatController');
const protect = require('../middleware/authMiddleware');

router.post('/command', protect, parseChatCommand);

module.exports = router;