const express = require('express');
const upload = require('../config/multer'); // Multer configuration to handle file uploads
const { uploadMedia, getMedia } = require('../controllers/mediaController'); // Controller functions
const router = express.Router();

// Upload multiple files (unlimited size handling)
router.post('/upload', upload.array('files'), async (req, res) => {
    try {
        // Ensure files are uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        // Handle file uploads in media controller
        await uploadMedia(req, res);  // Calling the uploadMedia function to handle media processing
    } catch (error) {
        console.error('Error during file upload:', error);
        return res.status(500).json({ message: 'Error during file upload', error: error.message });
    }
});

// Fetch media messages by chatId
router.get('/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;

        // Get media from the media controller
        await getMedia(req, res, chatId); // You should implement this function to handle fetching media from your database
    } catch (error) {
        console.error('Error fetching media:', error);
        return res.status(500).json({ message: 'Error fetching media', error: error.message });
    }
});

module.exports = router;
