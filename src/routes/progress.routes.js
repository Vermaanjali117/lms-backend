const express = require('express');
const router = express.Router();
const {
    markLessonComplete,
    getCourseProgress,
    getAllProgress
} = require('../controllers/progress.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

router.use(protect);
router.use(authorizeRoles('student'));

router.post('/complete/:courseId/:lessonId', markLessonComplete);
router.get('/course/:courseId', getCourseProgress);
router.get('/all', getAllProgress);

module.exports = router;