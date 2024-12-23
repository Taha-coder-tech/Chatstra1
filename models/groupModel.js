const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    admins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    rules: {
        type: String, // To store group rules
    },
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            message: {
                type: String,
            },
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
