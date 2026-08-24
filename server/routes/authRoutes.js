const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const upload = require('../config/multer');

const uploadProfilePhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Failed to upload photo' });
    }
    next();
  });
};

const {
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword, 
  changePassword, 
  updateProfile,
  getDailyPreference,
  updateDailyPreference,
  getMood,
  updateMood,
  getAccountabilityPartner,
  updateAccountabilityPartner,
  getThemePreference,
  updateThemePreference
} = authController;

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.put('/profile', protect, uploadProfilePhoto, updateProfile);
router.get('/daily-preference', protect, getDailyPreference);
router.put('/daily-preference', protect, updateDailyPreference);
router.get('/mood', protect, getMood);
router.put('/mood', protect, updateMood);
router.get('/accountability-partner', protect, getAccountabilityPartner);
router.put('/accountability-partner', protect, updateAccountabilityPartner);
router.get('/theme', protect, getThemePreference);
router.put('/theme', protect, updateThemePreference);

module.exports = router;