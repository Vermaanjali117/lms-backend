const express = require('express');
const router = express.Router();
const { cache } = require('../middlewares/cache.middleware');
const {
    createCourse,
    getAllCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    submitCourse,
    addSection,
    addLesson,
    getInstructorCourses,
    getInstructorCourseById
} = require('../controllers/course.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');
router.get('/', cache(600), getAllCourses);      // cache 10 minutes
router.get('/:id', cache(600), getCourse);       // cache 10 minutes
// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourse);

// Protected routes
router.post('/', protect, authorizeRoles('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorizeRoles('instructor'), updateCourse);
router.delete('/:id', protect, authorizeRoles('instructor', 'admin'), deleteCourse);
router.post('/:id/submit', protect, authorizeRoles('instructor'), submitCourse);
router.post('/:id/sections', protect, authorizeRoles('instructor'), addSection);
router.get('/instructor/my-courses', protect, authorizeRoles('instructor'), getInstructorCourses);
router.get('/my-course/:id', protect, authorizeRoles('instructor'), getInstructorCourseById);
router.post('/:id/sections/:sectionId/lessons', protect, authorizeRoles('instructor'), addLesson);

module.exports = router;