const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5']
    },
    review: {
        type: String,
        required: [true, 'Review text is required'],
        trim: true,
        minlength: [10, 'Review must be at least 10 characters']
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// One review per student per course
reviewSchema.index({ student: 1, course: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;