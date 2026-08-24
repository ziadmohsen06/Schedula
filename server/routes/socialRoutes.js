const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  sendFriendRequest,
  getIncomingRequests,
  respondToRequest,
  getFriends,
  removeFriend,
  getLeaderboard
} = require('../controllers/socialController');

router.post('/friends/request', protect, sendFriendRequest);
router.get('/friends/requests', protect, getIncomingRequests);
router.post('/friends/requests/:id/:action', protect, respondToRequest);
router.get('/friends', protect, getFriends);
router.delete('/friends/:id', protect, removeFriend);
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;
