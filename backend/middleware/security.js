/**
 * Middleware to protect against deeply nested objects (DoS protection)
 */
export const depthLimit = (maxDepth = 5) => {
    const getDepth = (obj) => {
        if (typeof obj !== 'object' || obj === null) return 0;
        return 1 + Math.max(0, ...Object.values(obj).map(getDepth));
    };

    return (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            const depth = getDepth(req.body);
            if (depth > maxDepth) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VAL_MALFORMED_JSON',
                        message: `Body depth of ${depth} exceeds limit of ${maxDepth}`
                    }
                });
            }
        }
        next();
    };
};
