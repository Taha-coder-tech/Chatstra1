const express = require('express');
const { createPoll, voteOnPoll } = require('../controllers/pollController');
const { protect } = require('../middleware/auth'); // Adjusted to use 'protect' from auth.js

const router = express.Router();

// Create a poll in a group
router.post('/create', protect, createPoll);

// Vote on a poll
router.post('/vote', protect, voteOnPoll);

module.exports = router;
