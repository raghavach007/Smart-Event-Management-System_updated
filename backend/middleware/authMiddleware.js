// File: backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ message: 'No token provided. Access denied.' });

  try {
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireRole = (rolesArray) => {
  return (req, res, next) => {
    if (!req.user || !rolesArray.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Requires one of these roles: ${rolesArray.join(', ')}.` 
      });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };