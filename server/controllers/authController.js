const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const LoginHistory = require('../models/LoginHistory');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const { logAuditEvent, logLoginAuditEvent, getClientIp } = require('../utils/audit');
const { sendEmail, renderEmailShell } = require('../utils/email');
const { scorePasswordStrength, parseDevice, generateSessionId } = require('../utils/security');

const MAX_LOGIN_HISTORY = 10;

const generateToken = (id, jti) => {
  return jwt.sign({ id, jti }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Creates a Session record (for the "active sessions" list / revocation) and a
// LoginHistory entry (capped at the most recent MAX_LOGIN_HISTORY), and returns
// the session id (jti) to embed in the JWT.
const createSessionAndHistory = async (userId, req, { warning = false } = {}) => {
  const jti = generateSessionId();
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const device = parseDevice(userAgent);

  await Session.create({ user: userId, tokenId: jti, ipAddress, userAgent, device });

  await LoginHistory.create({ user: userId, ipAddress, device, warning });
  const historyCount = await LoginHistory.countDocuments({ user: userId });
  if (historyCount > MAX_LOGIN_HISTORY) {
    const excess = await LoginHistory.find({ user: userId })
      .sort({ timestamp: 1 })
      .limit(historyCount - MAX_LOGIN_HISTORY);
    await LoginHistory.deleteMany({ _id: { $in: excess.map((e) => e._id) } });
  }

  return jti;
};

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
      passwordHistory: [],
      passwordStrengthScore: scorePasswordStrength(password)
    });

    await User.findByIdAndUpdate(user._id, {
      passwordHistory: [user.password]
    });

    await logAuditEvent(user._id, 'register', req);
    const jti = await createSessionAndHistory(user._id, req);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dailyStartPreference: user.dailyStartPreference,
      token: generateToken(user._id, jti)
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

    const warning = await logLoginAuditEvent(user._id, req);
    const jti = await createSessionAndHistory(user._id, req, { warning });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dailyStartPreference: user.dailyStartPreference,
      token: generateToken(user._id, jti)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.sessionId) {
      await Session.updateOne({ tokenId: req.sessionId, user: req.user._id }, { revoked: true });
    }
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
        const themeName = user.themePreference?.name;
        const bodyHtml = `
          <p class="info-text">Hi <strong>${user.name}</strong>,</p>
          <p class="info-text">We received a request to reset your password. Use the code below to complete the process:</p>
          <div class="otp-box">
            <p class="otp-code">${otp}</p>
          </div>
          <p class="info-text">This code will expire in <span class="highlight">10 minutes</span> for security reasons.</p>
          <p class="info-text">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        `;

        await sendEmail({
          to: user.email,
          subject: 'Your Schedula Password Reset Code',
          html: renderEmailShell({ bodyHtml, themeName })
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
    user.passwordStrengthScore = scorePasswordStrength(newPassword);
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
    user.passwordStrengthScore = scorePasswordStrength(newPassword);
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

// Mood check-in: ask once per day, use it to color the AI daily briefing tone.
const getMood = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = new Date().toDateString();
    const lastCheckIn = user.lastMoodCheckIn?.date
      ? new Date(user.lastMoodCheckIn.date).toDateString()
      : null;

    res.json({
      mood: lastCheckIn === today ? user.lastMoodCheckIn.mood : null,
      shouldPrompt: lastCheckIn !== today
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const updateMood = async (req, res) => {
  try {
    const { mood } = req.body;
    if (!['great', 'okay', 'tired', 'stressed'].includes(mood)) {
      return res.status(400).json({ message: 'Invalid mood' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { lastMoodCheckIn: { mood, date: new Date() } },
      { new: true }
    );

    res.json({ success: true, mood: user.lastMoodCheckIn.mood });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const getAccountabilityPartner = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ accountabilityPartnerEmail: user.accountabilityPartnerEmail || '' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const updateAccountabilityPartner = async (req, res) => {
  try {
    const { email } = req.body;

    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { accountabilityPartnerEmail: email || '' },
      { new: true }
    );

    res.json({ accountabilityPartnerEmail: user.accountabilityPartnerEmail });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const VALID_THEMES = ['garden', 'ocean', 'space', 'minimal'];

// Theme preference is mirrored server-side (in addition to localStorage) so
// server-generated content — password reset emails, weekly digests — can match
// the user's chosen look instead of always defaulting to garden.
const getThemePreference = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ themePreference: user.themePreference || { name: 'garden', darkMode: false } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const updateThemePreference = async (req, res) => {
  try {
    const { name, darkMode } = req.body;

    if (name !== undefined && !VALID_THEMES.includes(name)) {
      return res.status(400).json({ message: 'Invalid theme' });
    }

    const user = await User.findById(req.user._id);
    const current = user.themePreference || { name: 'garden', darkMode: false };

    user.themePreference = {
      name: name !== undefined ? name : current.name,
      darkMode: darkMode !== undefined ? darkMode : current.darkMode
    };
    await user.save();

    res.json({ themePreference: user.themePreference });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

// Semester date range bounds when the user's classes actually apply — the
// Calendar overlay and AI scheduling's class-conflict avoidance both use this
// so a class doesn't get treated as recurring forever, before it started or
// after the term ended.
const getSemesterDates = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ semester: user.semester || { startDate: null, endDate: null } });
  } catch (error) {
    res.status(500).json({ message: 'Unable to process request' });
  }
};

const updateSemesterDates = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const user = await User.findById(req.user._id);
    user.semester = {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };
    await user.save();

    res.json({ semester: user.semester });
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
  updateDailyPreference,
  getMood,
  updateMood,
  getAccountabilityPartner,
  updateAccountabilityPartner,
  getThemePreference,
  updateThemePreference,
  getSemesterDates,
  updateSemesterDates
};