// File: routes/pollRoutes.js
const express = require('express');
const router = express.Router();
const { createPoll, voteOnPoll } = require('../controllers/pollController');
const { protect, authenticateUser } = require('../middleware/auth'); // Import the updated authentication middleware

// Apply authentication middleware to all routes
router.use(authenticateUser); // Ensures all routes require a valid token

// Create a poll in a group
router.post('/create', protect, createPoll); // Uses the 'protect' middleware for additional validation if needed

// Vote on a poll
router.post('/vote', protect, voteOnPoll);

module.exports = router;
