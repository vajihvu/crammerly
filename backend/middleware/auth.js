import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';

/**
 * Protect routes middleware
 * Verifies the JWT token from the Authorization header
 * and forwards standardized errors to the global error handler.
 */
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        const err = new Error('Not authorized, no token provided');
        err.statusCode = 401;
        err.code = 'AUTH_REQUIRED';
        return next(err);
    }

    try {
        // Verify token using standard secret
        const secret = config.jwt.secret;
        const decoded = jwt.verify(token, secret);

        // Get user from the token, exclude password
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            const err = new Error('User associated with this token no longer exists');
            err.statusCode = 401;
            err.code = 'AUTH_INVALID';
            return next(err);
        }

        if (user.isActive === false) {
            const err = new Error('Account is deactivated');
            err.statusCode = 403;
            err.code = 'AUTH_DEACTIVATED';
            return next(err);
        }

        req.user = user;
        return next();
    } catch (_error) {
        const err = new Error('Not authorized, token invalid or expired');
        err.statusCode = 401;
        err.code = 'AUTH_EXPIRED';
        return next(err);
    }
};
