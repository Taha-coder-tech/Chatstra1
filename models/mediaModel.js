const mongoose = require('mongoose');

// Define the schema for media uploads
const mediaSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User who sent the file
        required: true, // Ensures the sender field is mandatory
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the receiver (optional, may be null for group messages)
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group', // Reference to the group (optional)
    },
    fileUrl: {
        type: String,
        required: true, // The URL of the uploaded file
    },
    fileType: {
        type: String,
        required: true, // The MIME type of the uploaded file (e.g., image/jpeg, video/mp4)
        enum: ['image', 'video', 'document'], // Restrict file types to specific categories
    },
    originalName: {
        type: String, // Stores the original file name
    },
    previewUrl: {
        type: String, // URL to the preview image or thumbnail for the file
    },
    thumbnailUrl: {
        type: String, // URL for video thumbnails or PDF previews
    },
    timestamp: {
        type: Date,
        default: Date.now, // Automatically set the timestamp to the current date and time
    },
});

// Create and export the Media model based on the schema
const Media = mongoose.model('Media', mediaSchema);

module.exports = Media;
