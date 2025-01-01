// routes/analyticsRoutes.js
const express = require('express');
const Analytics = require('../models/analyticsModel');
const router = express.Router();

// Endpoint to get group analytics report
router.get('/group/:groupId/report', async (req, res) => {
    const { groupId } = req.params;

    try {
        const analytics = await Analytics.findOne({ groupId });

        if (!analytics) {
            return res.status(404).json({ message: 'No analytics found for this group.' });
        }

        res.status(200).json(analytics);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics.' });
    }
});

// Endpoint to get active members report for the last 24 hours
router.get('/group/:groupId/active-members', async (req, res) => {
    const { groupId } = req.params;

    try {
        const analytics = await Analytics.findOne({ groupId });

        if (!analytics) {
            return res.status(404).json({ message: 'No analytics found for this group.' });
        }

        // Filter active members based on activity timestamp within the last 24 hours
        const activeMembers = analytics.groupActivity.filter(activity => {
            return activity.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000);
        });

        res.status(200).json({ activeMembers: activeMembers.length });
    } catch (error) {
        console.error('Error fetching active members report:', error);
        res.status(500).json({ message: 'Error fetching active members report.' });
    }
});

module.exports = router;
