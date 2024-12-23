const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    },
    message: {
        type: String,
        required: true,
    },
    iv: {
        type: String, // Store the initialization vector for encryption
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'], // Message delivery status
        default: 'sent',
    },
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;