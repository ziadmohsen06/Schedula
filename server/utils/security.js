const crypto = require('crypto');

// Rough password strength heuristic, 0-100. Only ever called with a plaintext
// password at the moment it's set (register/reset/change) — only the resulting
// score is persisted, never the password itself.
const scorePasswordStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  score += Math.min(40, password.length * 4);
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return Math.min(100, score);
};

// Friendly "Browser on OS" string parsed from a raw User-Agent header.
const parseDevice = (userAgent) => {
  if (!userAgent) return 'Unknown device';

  let os = 'Unknown OS';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(userAgent)) os = 'iOS';
  else if (/Mac OS/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  let browser = 'Unknown browser';
  if (/Edg\//i.test(userAgent)) browser = 'Edge';
  else if (/Chrome\//i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox\//i.test(userAgent)) browser = 'Firefox';
  else if (/Safari\//i.test(userAgent)) browser = 'Safari';

  return `${browser} on ${os}`;
};

const generateSessionId = () => crypto.randomBytes(16).toString('hex');

module.exports = { scorePasswordStrength, parseDevice, generateSessionId };
