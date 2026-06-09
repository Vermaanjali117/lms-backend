const { uploadToCloudinary } = require('../utils/cloudinary.utils');
const User = require('../models/user.model');
const Course = require('../models/course.model');
const AppError = require('../utils/error.utils');
const cloudinary = require('../config/cloudinary');
// Upload profile avatar
const uploadAvatar = async (req, res, next) => {
    console.log('Step 1: Request received!', req.body);
    console.log('File info:', req.file?.mimetype, req.file?.size);
    try {
        if (!req.file) {
            return next(new AppError('Please upload an image', 400));
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'avatars');
          console.log("result ====",result);
        // Update user avatar
        await User.findByIdAndUpdate(req.user._id, {
            avatar: result.secure_url
        });

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: result.secure_url
            }
        });

    } catch (error) {
        next(error);
    }
};

// Upload course thumbnail
const uploadThumbnail = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload an image', 400));
        }

        const course = await Course.findOne({
            _id: req.params.courseId,
            isDeleted: false
        });

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized', 403));
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'thumbnails');

        // Update course thumbnail
        await Course.findByIdAndUpdate(req.params.courseId, {
            thumbnail: result.secure_url
        });

        res.status(200).json({
            success: true,
            message: 'Thumbnail uploaded successfully',
            data: {
                thumbnail: result.secure_url
            }
        });

    } catch (error) {
        next(error);
    }
};


const uploadVideo = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Please upload a video', 400));
        }

        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'lms/videos',
                    resource_type: 'video',
                    chunk_size: 6000000 // 6MB chunks
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        res.status(200).json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                url: result.secure_url,
                duration: Math.round((result.duration || 0) / 60),
                size: result.bytes,
                format: result.format
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { uploadAvatar, uploadThumbnail, uploadVideo };