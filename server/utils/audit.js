const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const AuditLog = require('../models/AuditLog');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const pruneAuditLogs = async (userId) => {
  const logs = await AuditLog.find({ userId }).sort({ timestamp: 1 });
  if (logs.length <= 5) return;

  const toDelete = logs.slice(0, logs.length - 5);
  if (toDelete.length > 0) {
    await AuditLog.deleteMany({ _id: { $in: toDelete.map((log) => log._id) } });
  }
};

const logAuditEvent = async (userId, action, req, extra = {}) => {
  if (!userId) return;

  try {
    const ipAddress = extra.ipAddress || getClientIp(req);
    await AuditLog.create({
      userId,
      action,
      ipAddress,
      ...extra
    });
    await pruneAuditLogs(userId);
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

const logLoginAuditEvent = async (userId, req, extra = {}) => {
  if (!userId) return;

  try {
    const ipAddress = extra.ipAddress || getClientIp(req);
    const recentLogins = await AuditLog.find({
      userId,
      action: 'login',
      timestamp: { $gte: new Date(Date.now() - 60 * 1000) }
    }).sort({ timestamp: -1 });

    let warning = false;

    if (recentLogins.length > 0) {
      const lastLogin = recentLogins[0];
      if (lastLogin.ipAddress && lastLogin.ipAddress !== ipAddress) {
        warning = true;
      }

      if (recentLogins.length > 3) {
        const distinctIps = new Set(recentLogins.map((log) => log.ipAddress)).size;
        if (distinctIps > 1) {
          warning = true;
        }
      }
    }

    await AuditLog.create({
      userId,
      action: 'login',
      ipAddress,
      warning,
      ...extra
    });

    await pruneAuditLogs(userId);

    return warning;
  } catch (error) {
    console.error('Login audit log error:', error.message);
    return false;
  }
};

module.exports = {
  logAuditEvent,
  logLoginAuditEvent,
  getClientIp
};
