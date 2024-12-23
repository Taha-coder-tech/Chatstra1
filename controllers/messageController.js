// File: controllers/messageController.js
const Message = require('../models/messageModel');
const User = require('../models/userModel');

// Check if a user is blocked before sending a message
const createMessage = async (req, res) => {
    const { chatId, senderId, content, groupId } = req.body;
    const receiverId = req.body.receiverId || null; // If it's a private message

    try {
        // Check if the sender is blocked by the receiver
        const receiver = await User.findById(receiverId);

        if (receiver && receiver.blockedUsers.includes(senderId)) {
            return res.status(403).json({ message: 'You are blocked by this user' });
        }

        // Proceed with message creation if not blocked
        const newMessage = await Message.create({
            sender: senderId,
            content,
            group: groupId, // For group chats
            receiver: receiverId, // For private chats
        });

        // Send response after saving the message
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add reaction to a message
const addReaction = async (req, res) => {
    const { messageId, emoji } = req.body;
    const userId = req.userId; // Assuming you have an authenticated user

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if the user already reacted
        const existingReaction = message.reactions.find(
            (reaction) => reaction.user.toString() === userId.toString()
        );

        if (existingReaction) {
            // Update reaction if already exists
            existingReaction.emoji = emoji;
        } else {
            // Add new reaction
            message.reactions.push({ user: userId, emoji });
        }

        await message.save();

        // Send back the updated message
        res.status(200).json(message);
    } catch (error) {
        console.error('Error adding reaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get reactions for a message
const getReactions = async (req, res) => {
    const { messageId } = req.params;

    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.status(200).json(message.reactions);
    } catch (error) {
        console.error('Error getting reactions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    createMessage,
    addReaction,
    getReactions,
};
