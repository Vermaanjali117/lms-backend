const express = require('express');
const router = express.Router();
const {
    getPendingCourses,
    approveCourse,
    rejectCourse,
    getAllUsers,
    blockUnblockUser
} = require('../controllers/admin.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

// All admin routes are protected
router.use(protect);
router.use(authorizeRoles('admin'));

// Course management
router.get('/courses/pending', getPendingCourses);
router.put('/courses/:id/approve', approveCourse);
router.put('/courses/:id/reject', rejectCourse);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/block', blockUnblockUser);

module.exports = router;