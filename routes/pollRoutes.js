const express = require('express');
const router = express.Router();
const { createPoll, voteOnPoll } = require('../controllers/pollController');
const { isAuthenticated } = require('../middlewares/auth'); // Assuming you have an authentication middleware

// Create a poll in a group
router.post('/create', isAuthenticated, createPoll);

// Vote on a poll
router.post('/vote', isAuthenticated, voteOnPoll);

module.exports = router;
