// routes/activityRoutes.js
const express = require('express');
const { updateActivity } = require('../services/userActivityService');
const { protect } = require('../middleware/auth');  // Ensure this is a middleware function

const router = express.Router();

// Update user's typing status
router.post('/typing', protect, async (req, res) => {
    const { isTyping } = req.body;
    try {
        const user = await updateActivity(req.user.id, isTyping);
        res.status(200).json({ message: 'User activity updated', user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating activity', error: error.message });
    }
});

module.exports = router;
