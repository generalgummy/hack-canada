const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Sign JWT token
const signToken = (user) => {
  return jwt.sign(
    { id: user._id, userType: user.userType, isAdmin: user.isAdmin || false },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Protect routes — verify JWT
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Restrict to specific user types
const restrictTo = (...types) => {
  return (req, res, next) => {
    if (!types.includes(req.user.userType)) {
      return res.status(403).json({
        message: `Access denied. Only ${types.join(' or ')} users can perform this action.`,
      });
    }
    next();
  };
};

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { signToken, protect, restrictTo, adminOnly };
