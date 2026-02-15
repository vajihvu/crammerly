/**
 * Response Enhancer Middleware
 * Adds convenience methods to the response object for standardized API responses
 * without monkey-patching core Express methods like res.json
 */
export const responseEnhancer = (req, res, next) => {
    /**
     * Standard success response
     * @param {Object} data - The payload to send
     * @param {number} statusCode - HTTP status code (default 200)
     */
    res.sendSuccess = (data, statusCode = 200, message = undefined) => {
        return res.status(statusCode).json({
            success: true,
            data,
            message,
            meta: {
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                version: 'v1',
                requestId: req.requestId
            }
        });
    };


    /**
     * Standard error response
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code (default 400)
     * @param {string} code - Internal error code
     */
    res.sendError = (message, statusCode = 400, code = 'API_ERROR') => {
        return res.status(statusCode).json({
            success: false,
            error: {
                message,
                code
            },
            meta: {
                timestamp: new Date().toISOString(),
                path: req.originalUrl,
                version: 'v1',
                requestId: req.requestId
            }
        });
    };

    next();
};
