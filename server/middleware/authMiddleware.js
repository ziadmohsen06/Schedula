const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const SESSION_ACTIVITY_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    if (token.length > 500) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Tokens issued before session tracking was added have no jti — grandfather
    // them through unrevocable until they naturally expire or the user re-logs-in.
    if (decoded.jti) {
      const session = await Session.findOne({ tokenId: decoded.jti, user: user._id });

      if (!session || session.revoked) {
        return res.status(401).json({ message: 'Session expired or revoked. Please log in again.' });
      }

      if (Date.now() - session.lastActiveAt.getTime() > SESSION_ACTIVITY_UPDATE_INTERVAL_MS) {
        session.lastActiveAt = new Date();
        session.save().catch(() => {});
      }

      req.sessionId = decoded.jti;
    }

    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired, please login again' });
    }
    res.status(401).json({ message: 'Not authorized' });
  }
};

module.exports = protect;