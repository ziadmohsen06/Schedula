const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  getSecurityScore,
  getLoginHistory,
  getSessions,
  revokeSession
} = require('../controllers/securityController');

router.get('/score', protect, getSecurityScore);
router.get('/login-history', protect, getLoginHistory);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:id', protect, revokeSession);

module.exports = router;
