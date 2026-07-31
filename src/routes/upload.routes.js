const express = require('express');
const router = express.Router();
const { uploadAvatar, uploadThumbnail, uploadVideo } = require('../controllers/upload.controller');
const { uploadImage, uploadVideo: uploadVideoMiddleware } = require('../middlewares/upload.middleware');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');


router.post('/avatar', protect, uploadImage.single('avatar'), uploadAvatar);
router.post('/thumbnail/:courseId', protect, authorizeRoles('instructor'), uploadImage.single('thumbnail'), uploadThumbnail);
router.post('/video', protect, authorizeRoles('instructor'), uploadVideoMiddleware.single('video'), uploadVideo);

module.exports = router;