const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure that the "uploads" directory exists
const ensureUploadsDirectoryExists = () => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true }); // Create directory if it doesn't exist
    }
};

// Call this function to ensure the "uploads" directory exists
ensureUploadsDirectoryExists();

// Storage configuration: where to store files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Check if the directory exists before writing files
        const dir = 'uploads/';
        ensureUploadsDirectoryExists();
        cb(null, dir); // Destination directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename based on timestamp
    },
});

// Filter for allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'audio/mpeg', 'video/mp4'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept file
    } else {
        cb(new Error('Invalid file type. Allowed types are JPEG, PNG, PDF, MP3, MP4'), false); // Reject file
    }
};

// Set up Multer with storage and file filter, without file size limit
const upload = multer({ 
    storage, 
    fileFilter,
    // Remove the file size limit for unlimited size
});

module.exports = upload;
