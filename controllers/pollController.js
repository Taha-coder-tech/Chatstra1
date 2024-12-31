const Poll = require('../models/pollModel');
const Group = require('../models/groupModel');
const User = require('../models/userModel');

// Create a poll within a group
const createPoll = async (req, res) => {
    const { groupId, question, options } = req.body;
    const creatorId = req.user._id; // Get the creator's ID from the authenticated user

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Create a new poll
        const poll = new Poll({
            question,
            options: options.map(option => ({ option })),
            creator: creatorId,
            groupId: group._id,
        });

        await poll.save();

        // Add poll to group
        group.polls.push(poll._id);
        await group.save();

        res.status(200).json({ message: 'Poll created successfully', poll });
    } catch (error) {
        console.error('Error creating poll:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Vote on a poll
const voteOnPoll = async (req, res) => {
    const { pollId, optionIndex } = req.body;
    const userId = req.user._id; // Get the user ID from the authenticated user

    try {
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({ message: 'Invalid option index' });
        }

        // Check if the user has already voted
        if (poll.voters && poll.voters.includes(userId)) {
            return res.status(400).json({ message: 'You have already voted on this poll' });
        }

        // Vote on the poll
        poll.options[optionIndex].votes += 1;
        if (!poll.voters) {
            poll.voters = [];
        }
        poll.voters.push(userId); // Keep track of who voted

        await poll.save();

        res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error voting on poll:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { createPoll, voteOnPoll };
