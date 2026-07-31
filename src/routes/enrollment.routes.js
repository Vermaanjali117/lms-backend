const express = require('express');
const router = express.Router();
const {
    enrollFree,
    getMyEnrollments,
    checkEnrollment
} = require('../controllers/enrollment.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

// All routes protected
router.use(protect);
router.use(authorizeRoles('student'));

router.post('/enroll/:courseId', enrollFree);
router.get('/my-enrollments', getMyEnrollments);
router.get('/check/:courseId', checkEnrollment);

module.exports = router;