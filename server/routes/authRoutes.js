const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

const {
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword, 
  changePassword, 
  updateProfile,
  getDailyPreference,
  updateDailyPreference
} = authController;

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.get('/daily-preference', protect, getDailyPreference);
router.put('/daily-preference', protect, updateDailyPreference);

module.exports = router;