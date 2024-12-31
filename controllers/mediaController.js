const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Media = require('../models/mediaModel'); // Media model

// Upload media
const uploadMedia = async (req, res) => {
    try {
        const { sender, receiver, group, chatId } = req.body;

        // Map uploaded files
        const mediaList = await Promise.all(
            req.files.map(async (file) => {
                const fileUrl = `/uploads/${file.filename}`;
                let previewUrl = null;

                // Process different media types
                if (file.mimetype.startsWith('image')) {
                    previewUrl = fileUrl; // Use the original image as preview
                } else if (file.mimetype === 'application/pdf') {
                    previewUrl = fileUrl; // Use the original PDF as preview
                } else if (file.mimetype.startsWith('video')) {
                    // Handle video: generate a thumbnail
                    const thumbnailPath = `thumbnails/${Date.now()}-thumbnail.jpg`;
                    const optimizedThumbnailPath = `thumbnails/${Date.now()}-optimized-thumbnail.webp`;

                    // Generate a thumbnail using FFmpeg
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

                    // Optimize the thumbnail with Sharp
                    await sharp(thumbnailPath)
                        .resize(320, 240) // Resize
                        .webp({ quality: 80 }) // Convert to WebP
                        .toFile(optimizedThumbnailPath);

                    // Remove the original thumbnail
                    fs.unlinkSync(thumbnailPath);

                    // Use the optimized thumbnail as the preview
                    previewUrl = `/uploads/${optimizedThumbnailPath}`;
                }

                return {
                    sender,
                    receiver,
                    group,
                    chatId,
                    fileUrl,
                    fileType: file.mimetype.startsWith('image')
                        ? 'image'
                        : file.mimetype.startsWith('video')
                        ? 'video'
                        : 'document',
                    originalName: file.originalname,
                    previewUrl,
                };
            })
        );

        // Save media records in the database
        const savedMedia = await Media.insertMany(mediaList);

        // Clean up original uploaded files
        req.files.forEach((file) => fs.unlinkSync(file.path));

        res.status(201).json(savedMedia);
    } catch (error) {
        console.error('Error during media upload:', error);
        res.status(500).json({ error: 'Error processing media upload', message: error.message });
    }
};

// Get media
const getMedia = async (req, res, chatId) => {
    try {
        const media = await Media.find({
            $or: [{ sender: chatId }, { receiver: chatId }],
        }).sort({ timestamp: -1 });

        res.status(200).json(media);
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Error fetching media', message: error.message });
    }
};

module.exports = { uploadMedia, getMedia };
