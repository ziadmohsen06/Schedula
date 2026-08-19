const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { logAuditEvent, logLoginAuditEvent } = require('../utils/audit');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      passwordHistory: []
    });

    await User.findByIdAndUpdate(user._id, {
      passwordHistory: [user.password]
    });

    await logAuditEvent(user._id, 'register', req);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dailyStartPreference: user.dailyStartPreference,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await logLoginAuditEvent(user._id, req);

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dailyStartPreference: user.dailyStartPreference,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const logout = async (req, res) => {
  try {
    await logAuditEvent(req.user._id, 'logout', req);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const user = await User.findOne({ email }).select('+passwordResetOtp +passwordResetOtpExpiresAt');

    if (user) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const hashedOtp = await bcryptjs.hash(otp, 10);

      user.passwordResetOtp = hashedOtp;
      user.passwordResetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      try {
                await transporter.sendMail({
          from: `"Schedula Garden" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: '🌿 Your Schedula Password Reset Code',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                body {
                  font-family: 'Inter', Arial, sans-serif;
                  background-color: #F4FAF3;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 500px;
                  margin: 40px auto;
                  background: #FCFFFC;
                  border-radius: 20px;
                  overflow: hidden;
                  box-shadow: 0 10px 40px rgba(63, 143, 90, 0.15);
                }
                .header {
                  background: linear-gradient(135deg, #69C37D 0%, #3F8F5A 100%);
                  padding: 40px 30px;
                  text-align: center;
                  position: relative;
                }
                .header h1 {
                  color: white;
                  margin: 10px 0 0 0;
                  font-size: 28px;
                  font-weight: 700;
                }
                .header p {
                  color: rgba(255, 255, 255, 0.9);
                  margin: 5px 0 0 0;
                  font-size: 14px;
                }
                .leaf-icon {
                  font-size: 50px;
                  display: block;
                }
                .content {
                  padding: 40px 30px;
                }
                .otp-box {
                  background: linear-gradient(135deg, #F4FAF3 0%, #E8F5E9 100%);
                  border: 2px dashed #69C37D;
                  border-radius: 15px;
                  padding: 20px;
                  text-align: center;
                  margin: 20px 0;
                }
                .otp-code {
                  font-size: 36px;
                  font-weight: 700;
                  color: #3F8F5A;
                  letter-spacing: 8px;
                  margin: 0;
                }
                .info-text {
                  color: #6C7A6D;
                  font-size: 14px;
                  line-height: 1.6;
                  margin: 15px 0;
                }
                .footer {
                  text-align: center;
                  padding: 20px;
                  color: #6C7A6D;
                  font-size: 12px;
                  border-top: 1px solid #E0E0E0;
                }
                .highlight {
                  color: #3F8F5A;
                  font-weight: 600;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <span class="leaf-icon">🌿</span>
                  <h1>Schedula</h1>
                  <p>Your Productivity Garden</p>
                </div>
                <div class="content">
                  <p class="info-text">Hi <strong>${user.name}</strong>,</p>
                  <p class="info-text">We received a request to reset your password. Use the code below to complete the process:</p>
                  
                  <div class="otp-box">
                    <p class="otp-code">${otp}</p>
                  </div>
                  
                  <p class="info-text">This code will expire in <span class="highlight">10 minutes</span> for security reasons.</p>
                  <p class="info-text">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
                </div>
                <div class="footer">
                  <p>🌱 Grow every day with Schedula</p>
                  <p>© 2026 Schedula. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        console.log(`OTP sent to ${user.email}`);
      } catch (mailError) {
        console.error('Email send error:', mailError.message);
        return res.status(502).json({ message: 'Unable to send reset email right now.' });
      }
    }

    res.status(200).json({ message: 'If an account exists, an email has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email }).select('+passwordResetOtp +passwordResetOtpExpiresAt +passwordHistory +password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (!user.passwordResetOtp || !user.passwordResetOtpExpiresAt || new Date() > user.passwordResetOtpExpiresAt) {
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isOtpMatch = await bcryptjs.compare(otp, user.passwordResetOtp);
    if (!isOtpMatch) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const existingHistory = user.passwordHistory || [];
    const passwordReused = await Promise.all(
      existingHistory.map((oldHash) => bcryptjs.compare(newPassword, oldHash))
    );

    if (passwordReused.some(Boolean)) {
      return res.status(400).json({ message: 'Please choose a different password' });
    }

    const newPasswordHash = await bcryptjs.hash(newPassword, 10);

    user.password = newPasswordHash;
    user.passwordHistory = [newPasswordHash, ...existingHistory].slice(0, 5);
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiresAt = undefined;

    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(req.user._id).select('+password +passwordHistory');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const existingHistory = user.passwordHistory || [];
    const passwordReused = await Promise.all(
      existingHistory.map((oldHash) => bcryptjs.compare(newPassword, oldHash))
    );

    if (passwordReused.some(Boolean)) {
      return res.status(400).json({ message: 'Please choose a different password' });
    }

    const newPasswordHash = await bcryptjs.hash(newPassword, 10);

    user.password = newPasswordHash;
    user.passwordHistory = [newPasswordHash, ...existingHistory].slice(0, 5);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name) user.name = req.body.name;

    // If multer provided a file, set the photoUrl to served uploads path
    if (req.file) {
      const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      user.photoUrl = fullUrl;
    } else if (req.body.photoUrl) {
      user.photoUrl = req.body.photoUrl;
    }

    await user.save();
    await logAuditEvent(req.user._id, 'profile updated', req);

    res.status(200).json({ _id: user._id, name: user.name, email: user.email, photoUrl: user.photoUrl });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

// NEW: Get daily preference
const getDailyPreference = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = new Date().toDateString();
    const lastUpdate = user.lastStartPreferenceUpdate 
      ? new Date(user.lastStartPreferenceUpdate).toDateString() 
      : null;

    res.json({
      dailyStartPreference: user.dailyStartPreference,
      shouldPrompt: lastUpdate !== today,
      lastStartPreferenceUpdate: user.lastStartPreferenceUpdate
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

// NEW: Update daily preference
const updateDailyPreference = async (req, res) => {
  try {
    const { preference } = req.body;

    if (!['early', 'mid', 'late', 'flexible'].includes(preference)) {
      return res.status(400).json({ message: 'Invalid preference' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        dailyStartPreference: preference,
        lastStartPreferenceUpdate: new Date(),
        hasSeenDailyPrompt: true
      },
      { new: true }
    );

    await logAuditEvent(req.user._id, 'updated daily preference', req);

    res.json({
      success: true,
      dailyStartPreference: user.dailyStartPreference,
      lastStartPreferenceUpdate: user.lastStartPreferenceUpdate
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

module.exports = { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword, 
  changePassword, 
  updateProfile,
  getDailyPreference,
  updateDailyPreference
};