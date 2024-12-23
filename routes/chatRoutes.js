const express = require('express');
const { sendMessage, getMessages } = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth'); // Ensure middleware exists
const router = express.Router();

// Send a message (POST request)
router.post('/send', authenticate, sendMessage);

// Get messages by chat ID (GET request)
router.get('/:chatId', authenticate, getMessages);

module.exports = router;

