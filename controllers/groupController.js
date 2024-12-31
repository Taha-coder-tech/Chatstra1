// File: controllers/groupController.js
const Group = require('../models/groupModel');
const User = require('../models/userModel');

// Create a new group
const createGroup = async (req, res) => {
    const { name, admin, members } = req.body;

    try {
        const group = await Group.create({ 
            name, 
            admin, 
            members: [admin, ...members], 
            admins: [admin] // Set the creator as the initial admin
        });
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a member to a group
const addMember = async (req, res) => {
    const { groupId, userId } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();
            res.status(200).json({ message: 'Member added successfully' });
        } else {
            res.status(400).json({ message: 'User is already a member' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Remove a member from a group
const removeMember = async (req, res) => {
    const { groupId, userId } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        group.members = group.members.filter((member) => member.toString() !== userId);
        await group.save();
        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send a message to a group
const sendGroupMessage = async (req, res) => {
    const { groupId, sender, message } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const newMessage = { sender, message };
        group.messages.push(newMessage);
        await group.save();
        res.status(200).json(newMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all messages from a group
const getGroupMessages = async (req, res) => {
    const { groupId } = req.params;

    try {
        const group = await Group.findById(groupId).populate('messages.sender', 'username email');
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.status(200).json(group.messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add an admin to the group
const addAdmin = async (req, res) => {
    const { groupId, userId } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (!group.admins.includes(req.user._id)) {
            return res.status(403).json({ message: 'Only admins can add new admins' });
        }

        if (group.members.includes(userId)) {
            group.admins.push(userId);
            await group.save();
            return res.status(200).json({ message: 'Admin added successfully' });
        } else {
            return res.status(400).json({ message: 'User is not a member of the group' });
        }
    } catch (error) {
        console.error('Error adding admin:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Ban a user from the group
const banUser = async (req, res) => {
    const { groupId, userId } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (!group.admins.includes(req.user._id)) {
            return res.status(403).json({ message: 'Only admins can ban users' });
        }

        group.members = group.members.filter((member) => member.toString() !== userId);
        await group.save();

        return res.status(200).json({ message: 'User banned successfully' });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Set group rules
const setGroupRules = async (req, res) => {
    const { groupId, rules } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (!group.admins.includes(req.user._id)) {
            return res.status(403).json({ message: 'Only admins can set group rules' });
        }

        group.rules = rules;
        await group.save();

        return res.status(200).json({ message: 'Group rules updated successfully' });
    } catch (error) {
        console.error('Error setting group rules:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createGroup,
    addMember,
    removeMember,
    sendGroupMessage,
    getGroupMessages,
    addAdmin,
    banUser,
    setGroupRules,
};
