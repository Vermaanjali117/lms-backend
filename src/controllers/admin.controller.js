const User = require('../models/user.model');
const Course = require('../models/course.model');
const Category = require('../models/category.model');
const AppError = require('../utils/error.utils');
const {
    sendCourseApprovedEmail,
    sendCourseRejectedEmail
} = require('../utils/email.utils');
// Get all pending courses
const getPendingCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({
            status: 'pending',
            isDeleted: false
        })
            .populate('instructor', 'name email')
            .populate('category', 'name');

        res.status(200).json({
            success: true,
            total: courses.length,
            data: courses
        });

    } catch (error) {
        next(error);
    }
};

// Approve course
const approveCourse = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        if (course.status !== 'pending') {
            return next(new AppError('Course is not pending review', 400));
        }

        // Step 1: Update status
        course.status = 'published';
        course.rejectionReason = '';

        // Step 2: Save first
        await course.save();

        // Step 3: Get instructor from DB
        const instructor = await User.findById(course.instructor);

        // Step 4: Send email
        await sendCourseApprovedEmail(instructor, course);

        res.status(200).json({
            success: true,
            message: 'Course approved and published successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Reject course
const rejectCourse = async (req, res, next) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return next(new AppError('Rejection reason is required', 400));
        }

        const course = await Course.findById(req.params.id);

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        if (course.status !== 'pending') {
            return next(new AppError('Course is not pending review', 400));
        }
        const instructor = await User.findById(course.instructor);
        course.status = 'rejected';
        course.rejectionReason = reason;
         await course.save();
        await sendCourseRejectedEmail(instructor, course, reason);
       

        res.status(200).json({
            success: true,
            message: 'Course rejected successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Get all users
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;

        const filter = {
            role: { $in: ['student', 'instructor'] }
        };

        if (role && ['student', 'instructor'].includes(role)) {
            filter.role = role;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const users = await User.find(filter)
            .select('-password -refreshToken')
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        next(error);
    }
};

// Block/Unblock user
const blockUnblockUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return next(new AppError('User not found', 404));
        }

        // Toggle block status
        user.isBlocked = !user.isBlocked;
        await user.save();

        res.status(200).json({
            success: true,
            message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPendingCourses,
    approveCourse,
    rejectCourse,
    getAllUsers,
    blockUnblockUser
};