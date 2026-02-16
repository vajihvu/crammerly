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
    // We expect 'X-CSRF-Token' or 'X-Requested-With' as proof of intent
    const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-requested-with'];

    if (!csrfHeader) {
        logger.warn('CSRF BLOCK: Missing anti-forgery header', {
            ip: req.ip,
            path: req.originalUrl,
            method: req.method
        });

        const error = new Error('Security Violation: CSFR Protection header missing (X-CSRF-Token)');
        error.statusCode = 403;
        error.code = 'SEC_CSRF_MISSING';
        return next(error);
    }

    next();
};
