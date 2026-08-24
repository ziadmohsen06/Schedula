const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { scheduleTask, getWorkloadInsights, getSmartSuggestions } = require('../controllers/aiController');

router.post('/schedule/:id', protect, scheduleTask);
router.get('/workload', protect, getWorkloadInsights);
router.get('/suggestions', protect, getSmartSuggestions);

module.exports = router;