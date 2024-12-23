const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Media = require('../models/mediaModel'); // Assuming you're storing media details

// Upload multiple files handler
const uploadMedia = async (req, res) => {
    const { sender, receiver, group, chatId } = req.body; // Make sure to include chatId
    const files = req.files; // Handling multiple files

    try {
        const mediaData = []; // Array to hold all media records

        // Loop through each uploaded file and process it
        for (const file of files) {
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
            let previewUrl = null;

            // Handle different media types
            if (file.mimetype.startsWith('image/')) {
                previewUrl = fileUrl; // Image preview
            } else if (file.mimetype === 'application/pdf') {
                previewUrl = fileUrl; // PDF preview
            } else if (file.mimetype.startsWith('video')) {
                // Handle video file: Generate thumbnail
                const thumbnailPath = `thumbnails/${Date.now()}-thumbnail.jpg`;
                const optimizedThumbnailPath = `thumbnails/${Date.now()}-optimized-thumbnail.webp`;

                // Generate a thumbnail for the video using FFmpeg
                await new Promise((resolve, reject) => {
                    ffmpeg(file.path)
                        .screenshots({
                            count: 1,
                            folder: 'thumbnails',
                            filename: path.basename(thumbnailPath),
                            size: '320x240',
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });

                // Optimize the generated thumbnail using Sharp
                await sharp(thumbnailPath)
                    .resize(320, 240) // Resize the image
                    .webp({ quality: 80 }) // Convert to WebP format with 80% quality
                    .toFile(optimizedThumbnailPath);

                // Remove the original thumbnail after optimization
                fs.unlinkSync(thumbnailPath);

                // Generate the URL for the optimized thumbnail
                previewUrl = `${req.protocol}://${req.get('host')}/${optimizedThumbnailPath}`;
            }

            // Create and store media record in the database
            const media = await Media.create({
                sender,
                receiver,
                group,
                chatId, // Ensure you store chatId to link it with the chat
                fileUrl,
                fileType: file.mimetype,
                previewUrl, // Store preview URL for media
            });

            mediaData.push(media);
        }

        // Clean up the original files from the server after processing
        files.forEach(file => fs.unlinkSync(file.path));

        // Return media details in response
        res.status(201).json(mediaData);
    } catch (error) {
        console.error('Error during file upload:', error);
        res.status(500).json({ message: 'Error processing your request. Please try again.' });
    }
};

module.exports = { uploadMedia };
