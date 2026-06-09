const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Base email sender
const sendEmail = async ({ to, subject, html }) => {
    try {
        const mailOptions = {
            from: `LMS Platform <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent to:', to);
    } catch (error) {
        console.error('Email error:', error);
    }
};

// Welcome email
const sendWelcomeEmail = async (user) => {
    await sendEmail({
        to: user.email,
        subject: 'Welcome to LMS Platform! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4F46E5;">Welcome to LMS Platform!</h2>
                <p>Hi <strong>${user.name}</strong>,</p>
                <p>Thank you for joining our platform. We're excited to have you!</p>
                <p>Start exploring our courses and begin your learning journey today.</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>LMS Team</strong></p>
            </div>
        `
    });
};

// Course approved email
const sendCourseApprovedEmail = async (instructor, course) => {
    await sendEmail({
        to: instructor.email,
        subject: '🎉 Your course has been approved!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10B981;">Course Approved!</h2>
                <p>Hi <strong>${instructor.name}</strong>,</p>
                <p>Great news! Your course <strong>${course.title}</strong> has been approved and is now live on the platform.</p>
                <p>Students can now enroll in your course.</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>LMS Team</strong></p>
            </div>
        `
    });
};

// Course rejected email
const sendCourseRejectedEmail = async (instructor, course, reason) => {
    await sendEmail({
        to: instructor.email,
        subject: '❌ Your course needs improvements',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #EF4444;">Course Rejected</h2>
                <p>Hi <strong>${instructor.name}</strong>,</p>
                <p>Unfortunately, your course <strong>${course.title}</strong> has been rejected.</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p>Please make the necessary improvements and resubmit.</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>LMS Team</strong></p>
            </div>
        `
    });
};

// Payment success email
const sendPaymentSuccessEmail = async (student, course) => {
    await sendEmail({
        to: student.email,
        subject: '✅ Payment Successful - Course Enrolled!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10B981;">Payment Successful!</h2>
                <p>Hi <strong>${student.name}</strong>,</p>
                <p>Your payment was successful and you are now enrolled in:</p>
                <h3 style="color: #4F46E5;">${course.title}</h3>
                <p>Start learning now and enjoy your course!</p>
                <br/>
                <p>Best regards,</p>
                <p><strong>LMS Team</strong></p>
            </div>
        `
    });
};

module.exports = {
    sendWelcomeEmail,
    sendCourseApprovedEmail,
    sendCourseRejectedEmail,
    sendPaymentSuccessEmail
};