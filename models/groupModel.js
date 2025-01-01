const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },  // Original field
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // Original field
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    rules: { type: String },  // Original field
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],  // Original field
    polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Poll' }],  // New field
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // New field from update
    createdAt: { type: Date, default: Date.now }, // New field from update
    updatedAt: { type: Date, default: Date.now }, // New field from update
    admins: [{  // Updated admin field for permission levels
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        permissionLevel: { 
            type: String, 
            enum: ['admin', 'moderator', 'member'],
            default: 'member'
        }
    }],
  },
  { timestamps: true }  // This will add `createdAt` and `updatedAt` automatically
);

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
