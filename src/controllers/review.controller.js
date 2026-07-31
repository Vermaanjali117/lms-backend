const Review = require('../models/review.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const AppError = require('../utils/error.utils');

// Add review
const addReview = async (req, res, next) => {
    try {
        const { rating, review } = req.body;
        const courseId = req.params.courseId;

        // Step 1: Check if enrolled
        const enrollment = await Enrollment.findOne({
            student: req.user._id,
            course: courseId
        });

        if (!enrollment) {
            return next(new AppError('You must be enrolled to review this course', 403));
        }

        // Step 2: Check if already reviewed
        const existingReview = await Review.findOne({
            student: req.user._id,
            course: courseId
        });

        if (existingReview) {
            return next(new AppError('You have already reviewed this course', 400));
        }

        // Step 3: Create review
        const newReview = await Review.create({
            student: req.user._id,
            course: courseId,
            rating,
            review
        });

        // Step 4: Update course average rating
        const allReviews = await Review.find({
            course: courseId,
            isDeleted: false
        });

        const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

        await Course.findByIdAndUpdate(courseId, {
            rating: Math.round(avgRating * 10) / 10,
            totalRatings: allReviews.length
        });

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: newReview
        });

    } catch (error) {
        next(error);
    }
};

// Get all reviews for a course
const getCourseReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({
            course: req.params.courseId,
            isDeleted: false
        })
            .populate('student', 'name avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            total: reviews.length,
            data: reviews
        });

    } catch (error) {
        next(error);
    }
};

// Update review
const updateReview = async (req, res, next) => {
   console.log('Updating review with ID:', req.params.reviewId);
    try {
        const { rating, review } = req.body;

        const existingReview = await Review.findOne({
            _id: req.params.reviewId,
            student: req.user._id,
            isDeleted: false
        });

        if (!existingReview) {
            return next(new AppError('Review not found', 404));
        }

        existingReview.rating = rating || existingReview.rating;
        existingReview.review = review || existingReview.review;
        await existingReview.save();

        // Recalculate average rating
        const allReviews = await Review.find({
            course: existingReview.course,
            isDeleted: false
        });

        const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;

        await Course.findByIdAndUpdate(existingReview.course, {
            rating: Math.round(avgRating * 10) / 10
        });

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: existingReview
        });

    } catch (error) {
        next(error);
    }
};

// Delete review
const deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return next(new AppError('Review not found', 404));
        }

        // Only student who wrote it or admin can delete
        if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to delete this review', 403));
        }

        review.isDeleted = true;
        await review.save();

        // Recalculate rating
        const allReviews = await Review.find({
            course: review.course,
            isDeleted: false
        });

        if (allReviews.length > 0) {
            const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;
            await Course.findByIdAndUpdate(review.course, {
                rating: Math.round(avgRating * 10) / 10,
                totalRatings: allReviews.length
            });
        } else {
            await Course.findByIdAndUpdate(review.course, {
                rating: 0,
                totalRatings: 0
            });
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { addReview, getCourseReviews, updateReview, deleteReview };