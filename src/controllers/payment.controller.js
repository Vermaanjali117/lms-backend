const Razorpay = require('razorpay');
const crypto = require('crypto');
const Enrollment = require('../models/enrollment.model');
const Course = require('../models/course.model');
const AppError = require('../utils/error.utils');
const { sendPaymentSuccessEmail } = require('../utils/email.utils');
// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Step 1: Create Razorpay Order
const createOrder = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.courseId);

        // Check course exists
        if (!course || course.isDeleted) {
            return next(new AppError('Course not found', 404));
        }

        // Check course is published
        if (course.status !== 'published') {
            return next(new AppError('Course is not available', 400));
        }

        // Check if free course
        if (course.price === 0) {
            return next(new AppError('This is a free course. Use free enrollment.', 400));
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            student: req.user._id,
            course: req.params.courseId
        });

        if (existingEnrollment) {
            return next(new AppError('Already enrolled in this course', 400));
        }

        // Create Razorpay order
        let order;
        try {
            order = await razorpay.orders.create({
                amount: course.price * 100,
                currency: 'INR',
                // ✅ Short and unique
                receipt: `rcpt_${Date.now()}`,
                notes: {
                    courseId: course._id.toString(),
                    studentId: req.user._id.toString()
                }
            });
            console.log('order created:', order);
        } catch (razorpayError) {
            console.log('Razorpay error status:', razorpayError.statusCode);
            console.log('Razorpay error:', JSON.stringify(razorpayError));
            return next(new AppError('Payment service error', 500));
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                courseName: course.title,
                coursePrice: course.price,
                keyId: process.env.RAZORPAY_KEY_ID
            }
        });

    } catch (error) {
        console.log('Full error:', JSON.stringify(error));
        next(error);
    }
};

// Step 2: Verify Payment & Create Enrollment
const verifyPayment = async (req, res, next) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            courseId
        } = req.body;

        // Step 1: Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return next(new AppError('Payment verification failed', 400));
        }

        // Step 2: Get course details
        const course = await Course.findById(courseId);
        if (!course) {
            return next(new AppError('Course not found', 404));
        }

        // Step 3: Create enrollment
        const enrollment = await Enrollment.create({
            student: req.user._id,
            course: courseId,
            paymentStatus: 'paid',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            amount: course.price
        });

        // Step 4: Increment total students
        await Course.findByIdAndUpdate(courseId, {
            $inc: { totalStudents: 1 }
        });
        const student = await User.findById(req.user._id);
        await sendPaymentSuccessEmail(student, course);
        res.status(201).json({
            success: true,
            message: 'Payment successful! Enrolled in course.',
            data: enrollment
        });

    } catch (error) {
        next(error);
    }
};

// Get all payments (admin)
const getAllPayments = async (req, res, next) => {
    try {
        const payments = await Enrollment.find({
            paymentStatus: 'paid'
        })
            .populate('student', 'name email')
            .populate('course', 'title price')
            .sort({ createdAt: -1 });

        // Calculate total revenue
        const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

        res.status(200).json({
            success: true,
            totalRevenue,
            total: payments.length,
            data: payments
        });

    } catch (error) {
        next(error);
    }
};


const getInstructorEarnings =async(req,res,next)=>{
    try {
        const Course = require('../models/course.model');

        // Get instructor's courses
        const instructorCourses = await Course.find({
            instructor: req.user._id
        }).select('_id');

        const courseIds = instructorCourses.map(c => c._id);

        // Get payments for those courses
        const payments = await Enrollment.find({
            course: { $in: courseIds },
            paymentStatus: 'paid'
        })
            .populate('student', 'name email')
            .populate('course', 'title price')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: payments
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { createOrder, verifyPayment, getAllPayments, getInstructorEarnings };