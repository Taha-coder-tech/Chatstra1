const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [
      {
        option: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
