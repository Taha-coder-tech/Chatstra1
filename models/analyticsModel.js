// models/analyticsModel.js
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    date: { type: Date, default: Date.now },
    totalMessages: { type: Number, default: 0 },  // Count of messages sent in the group
    activeMembers: { type: Number, default: 0 },  // Number of active members (active within the last 24 hours)
    groupActivity: [{ 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        activityType: { type: String, enum: ['message', 'join', 'leave'], required: true },
        timestamp: { type: Date, default: Date.now }
    }],  // List of activities, e.g., join, leave, message sent
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
