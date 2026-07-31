const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Lesson title is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['video', 'text'],
        required: true
    },
    content: {
        type: String, // video URL or text content
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const sectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Section title is required'],
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    lessons: [lessonSchema]
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Course title is required'],
        trim: true,
        minlength: [5, 'Title must be at least 5 characters']
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        minlength: [20, 'Description must be at least 20 characters']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    thumbnail: {
        type: String,
        default: ''
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'published', 'rejected'],
        default: 'draft'
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    sections: [sectionSchema],
    totalStudents: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;