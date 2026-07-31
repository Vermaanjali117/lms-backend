const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
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
    paymentStatus: {
        type: String,
        enum: ['free', 'paid', 'pending'],
        default: 'free'
    },
    paymentId: {
        type: String,
        default: null
    },
    orderId: {
        type: String,
        default: null
    },
    amount: {
        type: Number,
        default: 0
    },
    completedLessons: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    progress: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    lastAccessedLesson: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;