const express = require('express');
const { sendMessage, getMessages, pinMessage, unpinMessage } = require('../controllers/chatController'); // Ensure correct imports from the controller
const { protect } = require('../middleware/auth'); // Ensure correct import for middleware
const router = express.Router();

// Send a message (POST request)
router.post('/send', protect, sendMessage); // Ensure the sendMessage function exists and works

// Get messages by chat ID (GET request)
router.get('/:chatId', protect, getMessages); // Ensure the getMessages function exists and works

// New routes for pinning and unpinning messages:
router.post('/pin', pinMessage); // Pin a message
router.post('/unpin', unpinMessage); // Unpin a message

// New route for forwarding messages:
const { forwardMessage } = require('../controllers/chatController');

// Forward message route
router.post('/forward', forwardMessage);

module.exports = router;
