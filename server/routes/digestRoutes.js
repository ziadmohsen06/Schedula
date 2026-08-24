const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { sendWeeklyDigestToUser } = require('../utils/digest');

// Manually trigger a weekly digest email to the logged-in user, for testing.
router.post('/test', protect, async (req, res) => {
  try {
    await sendWeeklyDigestToUser(req.user);
    res.status(200).json({ message: 'Digest email sent' });
  } catch (error) {
    console.error('Digest test send error:', error.message);
    res.status(500).json({ message: 'Failed to send digest email' });
  }
});

module.exports = router;
