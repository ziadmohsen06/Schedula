const User = require('../models/User');
const Session = require('../models/Session');
const LoginHistory = require('../models/LoginHistory');

const getSecurityScore = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const passwordStrength = user.passwordStrengthScore || 0;
    const passwordPoints = Math.round(passwordStrength * 0.5);
    const twoFactorPoints = user.twoFactorEnabled ? 50 : 0;

    res.status(200).json({
      score: passwordPoints + twoFactorPoints,
      breakdown: {
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorPoints,
        passwordStrength,
        passwordPoints
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to compute security score' });
  }
};

const getLoginHistory = async (req, res) => {
  try {
    const history = await LoginHistory.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch login history' });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id, revoked: false })
      .sort({ lastActiveAt: -1 });

    res.status(200).json(sessions.map((s) => ({
      _id: s._id,
      device: s.device,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      current: s.tokenId === req.sessionId
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch sessions' });
  }
};

const revokeSession = async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.revoked = true;
    await session.save();

    res.status(200).json({ message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to revoke session' });
  }
};

module.exports = { getSecurityScore, getLoginHistory, getSessions, revokeSession };
