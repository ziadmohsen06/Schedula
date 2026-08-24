const User = require('../models/User');
const Task = require('../models/Task');
const Session = require('../models/Session');
const LoginHistory = require('../models/LoginHistory');
const AuditLog = require('../models/AuditLog');

const exportAccountData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -passwordHistory -twoFactorSecret -passwordResetOtp -passwordResetOtpExpiresAt');
    const tasks = await Task.find({ user: req.user._id });
    const loginHistory = await LoginHistory.find({ user: req.user._id }).sort({ timestamp: -1 });
    const auditLogs = await AuditLog.find({ userId: req.user._id }).sort({ timestamp: -1 });

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      tasks,
      loginHistory,
      auditLogs
    };

    res.setHeader('Content-Disposition', 'attachment; filename="schedula-data-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    res.status(500).json({ message: 'Unable to export account data' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Please confirm your password to delete your account' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    await Promise.all([
      Task.deleteMany({ user: req.user._id }),
      Session.deleteMany({ user: req.user._id }),
      LoginHistory.deleteMany({ user: req.user._id }),
      AuditLog.deleteMany({ userId: req.user._id })
    ]);

    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Unable to delete account' });
  }
};

module.exports = { exportAccountData, deleteAccount };
