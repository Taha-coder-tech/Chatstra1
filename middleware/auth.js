// File: middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if there's a token in the Authorization header (Bearer token format)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from "Bearer token"
      token = req.headers.authorization.split(' ')[1];

      // If token is missing or malformed
      if (!token) {
        return res.status(401).json({ message: 'Token missing or malformed' });
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request object based on the decoded JWT token's id
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(400).json({ message: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      }

      // Generic error handling
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
