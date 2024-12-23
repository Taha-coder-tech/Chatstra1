const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authenticate = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Assuming Bearer token

    if (!token) {
        return res.status(403).json({ message: 'Authentication token is missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify token
        const user = await User.findById(decoded.userId);          // Find user in DB

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        req.userId = user._id;  // Attach user ID to request object
        next();                 // Pass control to the next middleware
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = { authenticate };
