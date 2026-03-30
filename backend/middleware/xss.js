import sanitizeHtml from 'sanitize-html';

/**
 * XSS Sanitizer Middleware (Production-grade)
 * Uses sanitize-html library instead of fragile regex patterns.
 * Strips all HTML tags and attributes from incoming request data
 * to prevent stored/reflected XSS attacks.
 */
export const xssSanitize = (req, res, next) => {
    const sanitizeOptions = {
        allowedTags: [],        // Strip ALL HTML tags
        allowedAttributes: {},  // Strip ALL attributes
        disallowedTagsMode: 'recursiveEscape'
    };

    const sanitize = (val) => {
        if (typeof val !== 'string') return val;
        return sanitizeHtml(val, sanitizeOptions);
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
