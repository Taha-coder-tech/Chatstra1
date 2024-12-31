// File: controllers/userController.js
const User = require('../models/userModel');
const path = require('path');
const fs = require('fs');

// Update profile picture
const updateProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.userId); // Assuming user is authenticated and userId is available

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete previous profile picture if it exists
        if (user.profilePicture && user.profilePicture !== 'default-profile-picture.jpg') {
            const prevImagePath = path.join(__dirname, '../uploads', user.profilePicture);
            if (fs.existsSync(prevImagePath)) {
                fs.unlinkSync(prevImagePath);  // Remove the old image
            }
        }

        // Set the new profile picture
        const profilePictureUrl = req.file.filename;  // Assuming you're using multer for file uploads
        user.profilePicture = profilePictureUrl;

        await user.save();
        res.status(200).json({ message: 'Profile picture updated successfully', profilePictureUrl });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update status
const updateStatus = async (req, res) => {
    try {
        const user = await User.findById(req.userId); // Assuming user is authenticated

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update status, default to a preset message if not provided
        user.status = req.body.status || 'Hey there! I am using ChatApp.';
        await user.save();

        res.status(200).json({ message: 'Status updated successfully', status: user.status });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Save push token
const savePushToken = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findById(req.userId); // Assuming `req.userId` is added by the authentication middleware

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.fcmToken = token;
        await user.save();

        res.status(200).json({ message: 'Push token saved successfully' });
    } catch (error) {
        console.error('Error saving push token:', error);
        res.status(500).json({ message: 'Failed to save push token' });
    }
};

// Block a user
const blockUser = async (req, res) => {
    const { userIdToBlock } = req.body;
    const currentUserId = req.userId;  // From middleware after authentication

    try {
        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.blockedUsers.includes(userIdToBlock)) {
            return res.status(400).json({ message: 'User is already blocked' });
        }

        user.blockedUsers.push(userIdToBlock);
        await user.save();
        res.status(200).json({ message: 'User blocked successfully' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Report a user
const reportUser = async (req, res) => {
    const { userIdToReport, reason } = req.body;
    const currentUserId = req.userId;  // From middleware after authentication

    try {
        const user = await User.findById(currentUserId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.reportedUsers.includes(userIdToReport)) {
            return res.status(400).json({ message: 'User is already reported' });
        }

        user.reportedUsers.push({ user: userIdToReport, reason });
        await user.save();
        res.status(200).json({ message: 'User reported successfully' });
    } catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { 
    updateProfilePicture, 
    updateStatus, 
    savePushToken, 
    blockUser, 
    reportUser 
};

