// File: routes/groupRoutes.js
const express = require('express');
const Group = require('../models/groupModel');
const User = require('../models/userModel');
const Message = require('../models/messageModel'); // Assuming you have a message model
const { protect, authenticateUser } = require('../middleware/auth'); // Import both protect and authenticateUser
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

// Apply authentication to all routes
router.use(authenticateUser); // This ensures all routes require a valid token

// Helper function to check if user is admin
const isAdmin = async (groupId, userId) => {
    const group = await Group.findOne({ _id: groupId, 'admins.userId': userId, 'admins.permissionLevel': 'admin' });
    return !!group;
};

// Group management routes
router.post('/create', protect, createGroup);
router.post('/add-member', protect, addMember);
router.post('/remove-member', protect, removeMember);

// Messaging routes
router.post('/send-message', protect, sendGroupMessage);
router.get('/:groupId/messages', protect, getGroupMessages);

// Admin-specific routes
router.post('/add-admin', protect, addAdmin);
router.post('/ban-user', protect, banUser);
router.post('/set-rules', protect, setGroupRules);

// Add a new admin to the group
router.post('/group/:groupId/add-admin', protect, async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body; // userId to be added as admin

    try {
        const group = await Group.findById(groupId);
        const isAlreadyAdmin = group.admins.some(admin => admin.userId.toString() === userId);

        if (isAlreadyAdmin) {
            return res.status(400).json({ message: 'User is already an admin.' });
        }

        group.admins.push({ userId, permissionLevel: 'admin' });
        await group.save();

        res.status(200).json({ message: 'User added as admin successfully.' });
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ message: 'Error adding admin.' });
    }
});

// Remove an admin from the group
router.post('/group/:groupId/remove-admin', protect, async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body; // userId to be removed as admin

    try {
        const group = await Group.findById(groupId);
        const adminIndex = group.admins.findIndex(admin => admin.userId.toString() === userId);

        if (adminIndex === -1) {
            return res.status(400).json({ message: 'User is not an admin.' });
        }

        group.admins.splice(adminIndex, 1);
        await group.save();

        res.status(200).json({ message: 'Admin removed successfully.' });
    } catch (error) {
        console.error('Error removing admin:', error);
        res.status(500).json({ message: 'Error removing admin.' });
    }
});

// Delete a message (only for admins or moderators)
router.delete('/group/:groupId/message/:messageId', protect, async (req, res) => {
    const { groupId, messageId } = req.params;
    const userId = req.user.id; // Assuming you have user authentication implemented

    try {
        const userIsAdmin = await isAdmin(groupId, userId);

        if (!userIsAdmin) {
            return res.status(403).json({ message: 'You do not have permission to delete messages.' });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found.' });
        }

        await message.remove();

        res.status(200).json({ message: 'Message deleted successfully.' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message.' });
    }
});

// Ban a user from the group (only admins)
router.post('/group/:groupId/ban-user', protect, async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body; // userId to be banned

    try {
        const userIsAdmin = await isAdmin(groupId, req.user.id); // Check if the requester is an admin

        if (!userIsAdmin) {
            return res.status(403).json({ message: 'Only admins can ban users.' });
        }

        const group = await Group.findById(groupId);
        group.members = group.members.filter(member => member.toString() !== userId);
        await group.save();

        res.status(200).json({ message: 'User banned successfully.' });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ message: 'Error banning user.' });
    }
});

module.exports = router;
