const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');
const AppError = require('../utils/error.utils');

// Mark lesson as complete
const markLessonComplete = async (req, res, next) => {
    try {
        const { courseId, lessonId } = req.params;

        // Step 1: Find enrollment
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId
        });

        if (!enrollment) {
            return next(new AppError('You are not enrolled in this course', 403));
        }

        // Step 2: Check if lesson already completed
        const alreadyCompleted = enrollment.completedLessons.includes(lessonId);

        if (!alreadyCompleted) {
            // Step 3: Add lesson to completedLessons
            enrollment.completedLessons.push(lessonId);

            // Step 4: Update last accessed lesson
            enrollment.lastAccessedLesson = lessonId;

            // Step 5: Calculate progress %
            const course = await Course.findById(courseId);

            // Count total lessons across all sections
            let totalLessons = 0;
            course.sections.forEach(section => {
                totalLessons += section.lessons.length;
            });

            // Calculate percentage
            if (totalLessons > 0) {
                enrollment.progress = Math.round(
                    (enrollment.completedLessons.length / totalLessons) * 100
                );
            }

            // Step 6: Check if course completed
            if (enrollment.progress === 100) {
                enrollment.isCompleted = true;
            }

            await enrollment.save();
        }

        res.status(200).json({
            success: true,
            message: alreadyCompleted ? 'Lesson already completed' : 'Lesson marked as complete',
            data: {
                progress: enrollment.progress,
                completedLessons: enrollment.completedLessons,
                isCompleted: enrollment.isCompleted
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get course progress
const getCourseProgress = async (req, res, next) => {
    try {
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: req.params.courseId
        });

        if (!enrollment) {
            return next(new AppError('You are not enrolled in this course', 403));
        }

        res.status(200).json({
            success: true,
            data: {
                progress: enrollment.progress,
                completedLessons: enrollment.completedLessons,
                lastAccessedLesson: enrollment.lastAccessedLesson,
                isCompleted: enrollment.isCompleted
            }
        });

    } catch (error) {
        next(error);
    }
};

// Get all my courses progress
const getAllProgress = async (req, res, next) => {
    try {
        const enrollments = await Enrollment.find({
            student: req.user._id
        })
            .populate('course', 'title thumbnail totalStudents')
            .select('progress isCompleted lastAccessedLesson course');

        res.status(200).json({
            success: true,
            data: enrollments
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    markLessonComplete,
    getCourseProgress,
    getAllProgress
};