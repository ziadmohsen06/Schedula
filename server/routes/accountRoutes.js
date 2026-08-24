const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { exportAccountData, deleteAccount } = require('../controllers/accountController');

router.get('/export', protect, exportAccountData);
router.delete('/', protect, deleteAccount);

module.exports = router;
