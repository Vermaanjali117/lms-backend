const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');
const AppError = require('../utils/error.utils');

// Enroll in free course
const enrollFree = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.courseId);

        // Check course exists
        if (!course || course.isDeleted) {
            return next(new AppError('Course not found', 404));
        }

        // Check course is published
        if (course.status !== 'published') {
            return next(new AppError('Course is not available', 400));
        }

        // Check if paid course
        if (course.price > 0) {
            return next(new AppError('This is a paid course. Please purchase it.', 400));
        }
        console.log("Enrollment =====", Enrollment);
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            student: req.user._id,
            course: req.params.courseId
        });

        if (existingEnrollment) {
            return next(new AppError('Already enrolled in this course', 400));
        }

        // Create enrollment
        const enrollment = await Enrollment.create({
            student: req.user._id,
            course: req.params.courseId,
            paymentStatus: 'free',
            amount: 0
        });

        // Increment total students
        await Course.findByIdAndUpdate(req.params.courseId, {
            $inc: { totalStudents: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Enrolled successfully',
            data: enrollment
        });

    } catch (error) {
        next(error);
    }
};

// Get my enrollments
const getMyEnrollments = async (req, res, next) => {
    console.log('Looking for student:', req.user._id);
    console.log('Student ID type:', typeof req.user._id);
    try {
        const enrollments = await Enrollment.find({
            student: req.user._id
        })
            .populate('course', 'title thumbnail instructor price rating')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: enrollments.length,
            data: enrollments
        });

    } catch (error) {
        next(error);
    }
};

// Check if enrolled
const checkEnrollment = async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: req.params.courseId
        });

        res.status(200).json({
            success: true,
            isEnrolled: !!enrollment,
            data: enrollment
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { enrollFree, getMyEnrollments, checkEnrollment };