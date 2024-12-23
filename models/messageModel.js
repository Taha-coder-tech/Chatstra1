const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model (for private chats)
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group', // Reference to the Group model (for group chats)
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    reactions: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User', // Reference to the User model
                required: true,
            },
            emoji: {
                type: String,
                required: true,
            },
        },
    ],
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
