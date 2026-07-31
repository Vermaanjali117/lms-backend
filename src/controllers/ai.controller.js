const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const AppError = require('../utils/error.utils');
const {
    getCourseRecommendations,
    generateQuiz,
    getChatResponse,
    generateCourseDescription
} = require('../services/ai.service');

// Get AI course recommendations
const getRecommendations = async (req, res, next) => {
    try {
        // Get student's enrolled courses
        const enrollments = await Enrollment.find({
            student: req.user._id
        }).populate('course', 'title category');

        // Get all published courses not enrolled in
        const enrolledIds = enrollments.map(e => e.course?._id);
        const availableCourses = await Course.find({
            status: 'published',
            isDeleted: false,
            _id: { $nin: enrolledIds }
        }).select('_id title category').populate('category', 'name');

        if (availableCourses.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // Get AI recommendations
        const recommendedIds = await getCourseRecommendations(
            enrollments,
            availableCourses
        );

        // Get full course details
        const recommendedCourses = await Course.find({
            _id: { $in: recommendedIds }
        })
            .populate('instructor', 'name')
            .populate('category', 'name')
            .select('-sections');

        res.status(200).json({
            success: true,
            data: recommendedCourses
        });

    } catch (error) {
        next(error);
    }
};

// Generate quiz for a lesson
const getQuiz = async (req, res, next) => {
    try {
        const { lessonTitle, lessonContent } = req.body;

        if (!lessonTitle || !lessonContent) {
            return next(new AppError('Lesson title and content are required', 400));
        }

        const quiz = await generateQuiz(lessonTitle, lessonContent);

        res.status(200).json({
            success: true,
            data: quiz
        });

    } catch (error) {
        next(error);
    }
};

// AI Chatbot
const chat = async (req, res, next) => {
    try {
        const { message, courseContext } = req.body;

        if (!message) {
            return next(new AppError('Message is required', 400));
        }

        const response = await getChatResponse(message, courseContext);

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        next(error);
    }
};

// Generate course description
const generateDescription = async (req, res, next) => {
    try {
        const { title, category } = req.body;

        if (!title || !category) {
            return next(new AppError('Title and category are required', 400));
        }

        const description = await generateCourseDescription(title, category);

        res.status(200).json({
            success: true,
            data: description
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getRecommendations,
    getQuiz,
    chat,
    generateDescription
};