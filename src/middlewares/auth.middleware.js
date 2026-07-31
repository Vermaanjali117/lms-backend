const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    try {
        // Step 1: Get token from header
        const authHeader = req.headers.authorization;
     console.log("authHeader =====",authHeader)
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Step 2: Extract token
        const token = authHeader.split(' ')[1];
          console.log("authHeader.split(' ') ",authHeader.split(' '));
        // Step 3: Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Step 4: Find user
        const user = await User.findById(decoded.userId).select('-password -refreshToken');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Step 5: Check if blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked'
            });
        }

        // Step 6: Attach user to request
        req.user = user;

        // Step 7: Move to next middleware/route
        next();

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};



const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Only ${roles.join(', ')} can access this.`
            });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };
