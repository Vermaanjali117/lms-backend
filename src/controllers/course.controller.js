const Course = require('../models/course.model');
const AppError = require('../utils/error.utils');
const Category = require('../models/category.model');
const { clearCache } = require('../middlewares/cache.middleware');

// Create Course
const createCourse = async (req, res, next) => {
    try {
        const { title, description, price, category } = req.body;

        // Step 1: Validate fields
        if (!title || !description || price === undefined || price === null || !category) {
            return next(new AppError('All fields are required', 400));
        }

        // Step 2: Create course with instructor = logged in user
        const course = await Course.create({
            title,
            description,
            price,
            category,
            instructor: req.user._id,
            status: 'draft'
        });

        // Clear cache after creating
        await clearCache('/api/courses*');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });

    } catch (error) {
        next(error);
    }
};

// Get All Published Courses (with pagination + filtering)
const getAllCourses = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            search,
            minPrice,
            maxPrice,
            sortBy = 'createdAt'
        } = req.query;

        // Build filter object
        const filter = {
            status: 'published',
            isDeleted: false
        };

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Search by title
        if (search) {
            filter.title = {
                $regex: search,
                $options: 'i'
            };
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Get courses
        const courses = await Course.find(filter)
            .populate('instructor', 'name email avatar')
            .populate('category', 'name')
            .select('-sections')
            .sort({ [sortBy]: -1 })
            .skip(skip)
            .limit(Number(limit));

        // Get total count
        const total = await Course.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: courses,
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

// Get Single Course
const getCourse = async (req, res, next) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            isDeleted: false
        })
            .populate('instructor', 'name email avatar')
            .populate('category', 'name');

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        if (course.status !== 'published') {
            return next(new AppError('Course not found', 404));
        }

        res.status(200).json({
            success: true,
            data: course
        });

    } catch (error) {
        next(error);
    }
};

// Update Course
const updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            isDeleted: false
        });
        
        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized to update this course', 403));
        }

        // Can't edit while under review
        if (course.status === 'pending') {
            return next(new AppError('Cannot edit course while under review', 400));
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Clear cache after updating
        await clearCache('/api/courses*');

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: updatedCourse
        });

    } catch (error) {
        next(error);
    }
};

// Soft Delete Course
const deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized to delete this course', 403));
        }

        // Soft delete
        course.isDeleted = true;
        await course.save();

        // Clear cache after deleting
        await clearCache('/api/courses*');

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

// Submit Course for Review
const submitCourse =async(req,res,next)=>{
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized', 403));
        }

        // Can only submit draft or rejected courses
        if (!['draft', 'rejected'].includes(course.status)) {
            return next(new AppError('Course already submitted or published', 400));
        }

        course.status = 'pending';
        await course.save();

        // Clear cache after status change
        await clearCache('/api/courses*');

        res.status(200).json({
            success: true,
            message: 'Course submitted for review'
        });

    } catch (error) {
        next(error);
    }
};

// Add Section to Course
const addSection=async(req,res,next)=>{
    try {
        const { title } = req.body;

        if (!title) {
            return next(new AppError('Section title is required', 400));
        }

        const course = await Course.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized', 403));
        }

        // Add section
        course.sections.push({
            title,
            order: course.sections.length + 1,
            lessons: []
        });

        await course.save();

        // Clear cache
        await clearCache('/api/courses*');

        res.status(201).json({
            success: true,
            message: 'Section added successfully',
            data: course.sections
        });

    } catch (error) {
        next(error);
    }
};

// Add Lesson to Section
const addLesson = async (req, res, next) => {
    try {
        const { title, type, content, duration, isPreview } = req.body;

        if (!title || !type || !content) {
            return next(new AppError('Title, type and content are required', 400));
        }

        const course = await Course.findOne({
            _id: req.params.id,
            isDeleted: false
        });

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        // Check ownership
        if (course.instructor.toString() !== req.user._id.toString()) {
            return next(new AppError('Not authorized', 403));
        }

        // Find section
        const section = course.sections.id(req.params.sectionId);

        if (!section) {
            return next(new AppError('Section not found', 404));
        }

        // Add lesson
        section.lessons.push({
            title,
            type,
            content,
            duration: duration || 0,
            isPreview: isPreview || false,
            order: section.lessons.length + 1
        });

        await course.save();

        // Clear cache
        await clearCache('/api/courses*');

        res.status(201).json({
            success: true,
            message: 'Lesson added successfully',
            data: section.lessons
        });

    } catch (error) {
        next(error);
    }
};
// Get instructor's own courses
const getInstructorCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({
            instructor: req.user._id,
            isDeleted: false
        })
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: courses
        });
    } catch (error) {
        next(error);
    }
};
// Get single instructor course (any status)
const getInstructorCourseById = async (req, res, next) => {
     console.log("req.user:", req.user);
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            instructor: req.user._id,
            isDeleted: false
        })
            .populate('category', 'name');

        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        res.status(200).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// Add to exports
module.exports = {
    createCourse,
    getAllCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    getInstructorCourseById,
    submitCourse,
    addSection,
    addLesson,
    getInstructorCourses // ← add this
};
