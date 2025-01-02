// File: controllers/userController.js
const User = require('../models/userModel');
const NotificationSettings = require('../models/notificationSettingsModel');
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

// Register user
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create and save the user
        const newUser = new User({ name, email, password });
        await newUser.save();

        // Create default notification settings for the user
        const defaultSettings = new NotificationSettings({
            userId: newUser._id,
            notificationsEnabled: true,
            messageNotifications: true,
            groupActivityNotifications: true,
            mentionNotifications: true,
        });
        await defaultSettings.save();

        // Respond with the created user (omit password in response for security)
        res.status(201).json({
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
        });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user activity data (last seen, typing status)
const getUserActivity = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const activity = {
            lastSeen: user.lastSeen,
            isTyping: user.isTyping
        };

        res.status(200).json({ activity });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { 
    updateProfilePicture, 
    updateStatus, 
    savePushToken, 
    blockUser, 
    reportUser, 
    registerUser,
    getUserActivity
};
