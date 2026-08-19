const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Fix: Check how protect is exported
const protect = authMiddleware.protect || authMiddleware;

// Log what we're getting
console.log('authMiddleware type:', typeof authMiddleware);
console.log('authMiddleware keys:', Object.keys(authMiddleware));
console.log('protect type:', typeof protect);

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