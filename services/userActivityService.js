// services/userActivityService.js
const User = require('../models/userModel');

// Update user activity (last seen and typing status)
const updateActivity = async (userId, isTyping) => {
    try {
        const user = await User.findById(userId);
        if (user) {
            user.lastSeen = new Date();  // Update the 'last seen' time
            user.isTyping = isTyping;    // Update the 'is typing' status
            await user.save();
            return user;
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error updating user activity:', error);
        throw error;
    }
};

module.exports = {
    updateActivity
};
