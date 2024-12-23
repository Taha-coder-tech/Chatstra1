// File: routes/userRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    updateProfilePicture,
    updateStatus,
    savePushToken,
    blockUser,
    reportUser,
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth'); // Middleware for authentication

const router = express.Router();

// Multer setup for image file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store images in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file to prevent conflicts
    },
});

const upload = multer({ storage });

// Route to update profile picture
router.post('/updateProfilePicture', authenticate, upload.single('profilePicture'), updateProfilePicture);

// Route to update status
router.post('/updateStatus', authenticate, updateStatus);

// Route to save push token
router.post('/save-token', authenticate, savePushToken);

// Route to block a user
router.post('/block', authenticate, blockUser);

// Route to report a user
router.post('/report', authenticate, reportUser);

module.exports = router;
