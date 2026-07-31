const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    getAllPayments,
    getInstructorEarnings
} = require('../controllers/payment.controller');
const { protect, authorizeRoles } = require('../middlewares/auth.middleware');

// Student routes
router.post(
    '/create-order/:courseId',
    protect,
    authorizeRoles('student'),
    createOrder
);

router.post(
    '/verify',
    protect,
    authorizeRoles('student'),
    verifyPayment
);

// Admin route
router.get(
    '/all',
    protect,
    authorizeRoles('admin'),
    getAllPayments
);
router.get(
    '/instructor/earnings',
    protect,
    authorizeRoles('instructor'),
    getInstructorEarnings
);
module.exports = router;