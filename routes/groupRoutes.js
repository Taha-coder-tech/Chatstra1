// File: routes/groupRoutes.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
    createGroup,
    addMember,
    removeMember,
    sendGroupMessage,
    getGroupMessages,
    addAdmin,
    banUser,
    setGroupRules,
} = require('../controllers/groupController');

const router = express.Router();

// Group management routes
router.post('/create', authenticate, createGroup);
router.post('/add-member', authenticate, addMember);
router.post('/remove-member', authenticate, removeMember);

// Messaging routes
router.post('/send-message', authenticate, sendGroupMessage);
router.get('/:groupId/messages', authenticate, getGroupMessages);

// Admin-specific routes
router.post('/add-admin', authenticate, addAdmin);
router.post('/ban-user', authenticate, banUser);
router.post('/set-rules', authenticate, setGroupRules);

module.exports = router;
