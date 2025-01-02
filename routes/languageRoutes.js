// routes/languageRoutes.js
const express = require('express');
const User = require('../models/userModel');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Get user's preferred language
router.get('/language', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ preferredLanguage: user.preferredLanguage });
    } catch (error) {
        console.error('Error fetching language preference:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user's preferred language
router.put('/language', protect, async (req, res) => {
    const { preferredLanguage } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.preferredLanguage = preferredLanguage;
        await user.save();

        res.status(200).json({ message: 'Language preference updated successfully.' });
    } catch (error) {
        console.error('Error updating language preference:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
