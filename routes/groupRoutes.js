// File: routes/groupRoutes.js
const express = require('express');
const { protect } = require('../middleware/auth'); // Use 'protect' from authMiddleware (or adjust as necessary)
const {
    createGroup,
    addMember,
    removeMember,
    sendGroupMessage,
    getGroupMessages,
    addAdmin,
    banUser,
    setGroupRules,
} = require('../controllers/groupController'); // Ensure correct import from groupController

const router = express.Router();

// Group management routes
router.post('/create', protect, createGroup);  // Use 'protect' if that's what your middleware is called
router.post('/add-member', protect, addMember);
router.post('/remove-member', protect, removeMember);

// Messaging routes
router.post('/send-message', protect, sendGroupMessage);
router.get('/:groupId/messages', protect, getGroupMessages);

// Admin-specific routes
router.post('/add-admin', protect, addAdmin);
router.post('/ban-user', protect, banUser);
router.post('/set-rules', protect, setGroupRules);

module.exports = router;
