/**
 * Role-Based Authorization Middleware
 *
 * Usage: router.get('/admin/users', protect, authorize('admin'), handler)
 * Usage: router.get('/route', protect, authorize('admin', 'editor'), handler)
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error('Not authenticated');
            error.statusCode = 401;
            error.code = 'AUTH_REQUIRED';
            return next(error);
        }

        if (!roles.includes(req.user.role)) {
            const error = new Error(
                `Access Denied: This action requires one of the following roles: [${roles.join(', ')}]`
            );
            error.statusCode = 403;
            error.code = 'AUTH_FORBIDDEN';
            return next(error);
        }

        next();
    };
};
