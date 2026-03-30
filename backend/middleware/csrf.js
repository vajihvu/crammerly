import { logger } from '../utils/logger.js';
import config from '../config/index.js';

export const csrfGuard = (req, res, next) => {
    // 1. Skip for Read-only methods (Safe methods)
    const stateChangingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    // skip in tests unless explicitly requested for security testing
    // We check both config and direct process.env to bridge any module loading sync issues
    const isTestMode = config.isTest || process.env.NODE_ENV === 'test';

    if (isTestMode && !req.headers['x-test-csrf-enforce']) {
        return next();
    }

    if (!stateChangingMethods.includes(req.method)) {
        return next();
    }

    // 2. Strict Protection Check
    // Require 'X-Requested-With: XMLHttpRequest' as proof of same-origin intent.
    // CORS prevents cross-origin requests from setting custom headers,
    // so this effectively blocks cross-site form submissions and script-based CSRF.
    const xRequestedWith = req.headers['x-requested-with'];

    if (xRequestedWith !== 'XMLHttpRequest') {
        logger.warn('CSRF BLOCK: Missing or invalid anti-forgery header', {
            ip: req.ip,
            path: req.originalUrl,
            method: req.method,
            receivedHeader: xRequestedWith || '(none)'
        });

        const error = new Error('Security Violation: CSRF Protection header missing or invalid (X-Requested-With: XMLHttpRequest required)');
        error.statusCode = 403;
        error.code = 'SEC_CSRF_MISSING';
        return next(error);
    }

    next();
};
