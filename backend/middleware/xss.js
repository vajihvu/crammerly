/**
 * Lightweight XSS Sanitizer Middleware
 * Strips script tags and dangerous HTML attributes from incoming requests.
 * Standardizes inputs before they reach the controller layer.
 */
export const xssSanitize = (req, res, next) => {
    const sanitize = (val) => {
        if (typeof val !== 'string') return val;

        // Remove <script> blocks and dangerous attributes
        return val
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/on\w+="[^"]*"/gi, "")
            .replace(/on\w+='[^']*'/gi, "")
            .replace(/javascript:[^"']*/gi, "");
    };

    const processObject = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitize(obj[key]);
            } else if (typeof obj[key] === 'object') {
                processObject(obj[key]);
            }
        });
    };

    if (req.body) processObject(req.body);
    if (req.query) processObject(req.query);
    if (req.params) processObject(req.params);

    next();
};
