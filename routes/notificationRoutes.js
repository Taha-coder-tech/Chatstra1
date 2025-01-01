const express = require('express');
const NotificationSettings = require('../models/notificationSettingsModel');
const router = express.Router();

// Import the protect and authenticateUser middlewares from auth.js
const { protect, authenticateUser } = require('../middleware/auth');

// Get notification settings for a user
router.get('/settings', authenticateUser, async (req, res) => {
    try {
        const settings = await NotificationSettings.findOne({ userId: req.user.id });

        if (!settings) {
            return res.status(404).json({ message: 'Notification settings not found.' });
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Update notification settings for a user
router.put('/settings', authenticateUser, async (req, res) => {
    const { notificationsEnabled, messageNotifications, groupActivityNotifications, mentionNotifications } = req.body;

    try {
        let settings = await NotificationSettings.findOne({ userId: req.user.id });

        if (!settings) {
            // Create new settings if they don't exist
            settings = new NotificationSettings({
                userId: req.user.id,
                notificationsEnabled,
                messageNotifications,
                groupActivityNotifications,
                mentionNotifications
            });
        } else {
            // Update existing settings
            settings.notificationsEnabled = notificationsEnabled;
            settings.messageNotifications = messageNotifications;
            settings.groupActivityNotifications = groupActivityNotifications;
            settings.mentionNotifications = mentionNotifications;
        }

        await settings.save();

        res.status(200).json({ message: 'Notification settings updated successfully.' });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
