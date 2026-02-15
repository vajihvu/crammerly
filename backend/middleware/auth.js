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

        // Get user from the token, include tokenVersion
        const user = await User.findById(decoded.id).select('-password +tokenVersion');

        if (!user) {
            const err = new Error('User associated with this token no longer exists');
            err.statusCode = 401;
            err.code = 'AUTH_INVALID';
            return next(err);
        }

        // 1. Global Revocation Check (Token Version)
        // If tokenVersion mismatches, the user reset their password or performed a global logout
        if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
            console.warn(`SECURITY ALERT: Token version mismatch for user ${user._id} (expected v${user.tokenVersion}, got v${decoded.tokenVersion}). Revoking access.`);
            const err = new Error('Security policy update: Your session has been revoked. Please log in again.');
            err.statusCode = 401;
            err.code = 'AUTH_SESSION_REVOKED';
            return next(err);
        }

        // 2. Individual Session Binding (Session Validation)
        // Access tokens are cryptographically bound to a specific session record
        if (!decoded.sessionId) {
            const err = new Error('Security policy violation: Missing session binding.');
            err.statusCode = 401;
            err.code = 'AUTH_INVALID_BINDING';
            return next(err);
        }

        const { default: Session } = await import('../models/Session.js');
        const session = await Session.findOne({
            _id: decoded.sessionId,
            user: user._id,
            isValid: true,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            console.warn(`SECURITY ALERT: Access token tied to invalid or expired session ${decoded.sessionId} for user ${user._id}`);
            const err = new Error('Your session is no longer valid. Please log in again.');
            err.statusCode = 401;
            err.code = 'AUTH_SESSION_INVALID';
            return next(err);
        }


        if (user.isActive === false) {
            const err = new Error('Account is deactivated');
            err.statusCode = 403;
            err.code = 'AUTH_DEACTIVATED';
            return next(err);
        }

        req.user = user;
        req.sessionId = decoded.sessionId;
        return next();
    } catch (err) {
        // 2. Granular Expiry/Invalid Handling for Observability
        let message = 'Not authorized, token invalid or expired';
        let code = 'AUTH_EXPIRED';

        if (err.name === 'TokenExpiredError') {
            console.log(`INFO: Access token expired for request at ${req.path}`);
            message = 'Token expired';
            code = 'AUTH_EXPIRED';
        } else if (err.name === 'JsonWebTokenError') {
            console.warn(`SECURITY ALERT: Invalid JWT signature/format at ${req.path}. Details: ${err.message}`);
            message = 'Invalid token';
            code = 'AUTH_INVALID';
        } else {
            console.error('INTERNAL ERROR: JWT Verification Error:', err.message);
        }

        const error = new Error(message);
        error.statusCode = 401;
        error.code = code;
        return next(error);
    }

};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            const err = new Error(`Role (${req.user?.role}) is not authorized to access this resource`);
            err.statusCode = 403;
            err.code = 'AUTH_FORBIDDEN';
            return next(err);
        }
        next();
    };
};

