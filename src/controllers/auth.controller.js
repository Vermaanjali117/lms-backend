const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { sendWelcomeEmail } = require('../utils/email.utils');
const { generateAccessToken, generateRefreshToken } = require('../utils/token.utils');
const jwt = require('jsonwebtoken');
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // Step 1: Check if all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // Step 2: Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Step 3: Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Step 4: Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'student',
            phone
        });

        // Step 5: Send welcome email
        await sendWelcomeEmail(user);

        // Step 6: Send response (never send password!)
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};








//   login function
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Step 1: Check fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Step 2: Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Step 3: Check if blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked'
            });
        }

        // Step 4: Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Step 5: Generate tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Step 6: Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

        // Step 7: Send refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        // Step 8: Send response
        res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const refreshAccessToken = async (req, res) => {
    try {
        // Step 1: Get refresh token from cookie
        const incomingRefreshToken = req.cookies.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not found'
            });
        }

        // Step 2: Verify refresh token
        const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        // Step 3: Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        // Step 4: Check if refresh token matches DB
        if (user.refreshToken !== incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is expired or used'
            });
        }

        // Step 5: Generate new access token
        const accessToken = generateAccessToken(user._id, user.role);

        // Step 6: Send new access token
        res.status(200).json({
            success: true,
            accessToken
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
};

const logout = async (req, res) => {
    try {
        // Step 1: Get refresh token from cookie
        const incomingRefreshToken = req.cookies.refreshToken;

        if (incomingRefreshToken) {
            // Step 2: Remove refresh token from DB
            await User.findOneAndUpdate(
                { refreshToken: incomingRefreshToken },
                { refreshToken: null }
            );
        }

        // Step 3: Clear cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getMe = async (req, res) => {
    console.log('req.user:', req.user);
    res.status(200).json({
        success: true,
        data: req.user
    });
};


// Update Profile
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });

    } catch (error) {
        next(error);
    }
};

// Change Password
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);

        // Check current password
        const isValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isValid) {
            return next(new AppError('Current password is incorrect', 400));
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    register, login, refreshAccessToken, logout, getMe, updateProfile,    // ← add this
    changePassword
}// ← add this};
// update exports






