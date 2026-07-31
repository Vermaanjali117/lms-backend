const express = require('express');
const router = express.Router();
const {
    getRecommendations,
    getQuiz,
    chat,
    generateDescription
} = require('../controllers/ai.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

// Student routes
router.get('/recommendations', protect, authorizeRoles('student'), getRecommendations);
router.post('/quiz', protect, getQuiz);
router.post('/chat', protect, chat);

// Instructor routes
router.post('/generate-description', protect, authorizeRoles('instructor'), generateDescription);

module.exports = router;