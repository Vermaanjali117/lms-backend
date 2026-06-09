const express = require('express');
const router = express.Router();
const {
    addReview,
    getCourseReviews,
    updateReview,
    deleteReview
} = require('../controllers/review.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

// Public - anyone can see reviews
router.get('/:courseId', getCourseReviews);

// Protected
router.post('/:courseId', protect, authorizeRoles('student'), addReview);
router.put('/:reviewId', protect, authorizeRoles('student'), updateReview);
router.delete('/:reviewId', protect, authorizeRoles('student'), deleteReview);
module.exports = router;