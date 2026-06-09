const multer = require('multer');
const AppError = require('../utils/error.utils');

const storage = multer.memoryStorage();

// Image filter
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Only image files are allowed', 400), false);
    }
};

// Video filter
const videoFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new AppError('Only video files are allowed', 400), false);
    }
};

// Image upload
const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Video upload
const uploadVideo = multer({
    storage,
    fileFilter: videoFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

module.exports = { uploadImage, uploadVideo };