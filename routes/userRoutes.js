// File: routes/userRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/userModel');
const { protect } = require('../middleware/auth'); // Middleware for protecting routes
const router = express.Router();

// Multer setup for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/profilePictures/'); // Store images in the 'profilePictures' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Rename file to prevent conflicts
  },
});

const upload = multer({ storage });

// Route to update profile picture and other details
router.put('/update', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const { username, bio } = req.body;
    const profilePicture = req.file ? req.file.path : ''; // Save the file path or leave it empty if no file is uploaded

    // Find the user by ID and update the details
    const user = await User.findById(req.user.id); // `req.user.id` is the ID of the authenticated user

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user profile
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        username: user.username,
        bio: user.bio,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Route to update status
router.put('/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { status }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ status: user.status });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Route to get user last seen
router.get('/last-seen/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ lastSeen: user.lastSeen });
  } catch (error) {
    console.error('Error fetching last seen:', error);
    res.status(500).json({ message: 'Error fetching last seen', error: error.message });
  }
});

// Route to save push notification token
router.post('/save-token', protect, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmToken = token;
    await user.save();

    return res.status(200).json({ message: 'Push token saved successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error saving push token', error: error.message });
  }
});

// Route to block a user
router.post('/block', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const blockedUser = await User.findById(userId);
    if (!blockedUser) {
      return res.status(404).json({ message: 'Blocked user not found' });
    }

    user.blockedUsers.push(blockedUser._id);
    await user.save();

    return res.status(200).json({ message: 'User blocked successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error blocking user', error: error.message });
  }
});

// Route to report a user
router.post('/report', protect, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reportedUser = await User.findById(userId);
    if (!reportedUser) {
      return res.status(404).json({ message: 'Reported user not found' });
    }

    user.reportedUsers.push({ userId: reportedUser._id, reason });
    await user.save();

    return res.status(200).json({ message: 'User reported successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error reporting user', error: error.message });
  }
});

module.exports = router;
