const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    scheduledTime: { type: Date }, // New field to store the scheduled time
    status: { type: String, default: 'pending' }, // Message status (pending, sent, etc.)
    createdAt: { type: Date, default: Date.now },
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
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
