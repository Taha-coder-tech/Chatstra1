const express = require('express');
const { addReaction, getReactions } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth'); // Assuming you have auth middleware
const router = express.Router();

// Add reaction to message
router.post('/react', authenticate, addReaction);

// Get reactions for a message
router.get('/:messageId/reactions', getReactions);

module.exports = router;
