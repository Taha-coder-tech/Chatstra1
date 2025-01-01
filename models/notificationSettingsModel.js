// models/notificationSettingsModel.js
const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notificationsEnabled: { type: Boolean, default: true }, // Whether notifications are enabled or not
    messageNotifications: { type: Boolean, default: true }, // Notifications for new messages
    groupActivityNotifications: { type: Boolean, default: true }, // Notifications for group activity
    mentionNotifications: { type: Boolean, default: true }, // Notifications for mentions
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);

module.exports = NotificationSettings;
