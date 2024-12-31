const User = require('../models/userModel');

// Set user status (Available, Busy, Away, etc.)
const setStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        // Find user by ID and update their status
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.status = status;
        user.lastSeen = new Date();  // Update last seen time when status is updated
        await user.save();

        return res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating status', error: error.message });
    }
};

// Get user status
const getStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user by ID and return their status
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ status: user.status, lastSeen: user.lastSeen });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching status', error: error.message });
    }
};

module.exports = { setStatus, getStatus };
