import axios from 'axios';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to verify Cloudflare Turnstile CAPTCHA
 */
export const verifyCaptcha = async (req, res, next) => {
    // Skip captcha in development if not configured or in test mode
    if ((config.isDevelopment && !config.turnstileSecretKey) || config.isTest) {
        return next();
    }

    // If secret key is not configured in any environment, allow through with a warning.
    // CAPTCHA is optional infrastructure — blocking permanently when key is missing prevents
    // all registration before Turnstile is set up.
    if (!config.turnstileSecretKey) {
        logger.warn('⚠️ TURNSTILE_SECRET_KEY not set — CAPTCHA verification skipped. Set key to enforce bot protection.');
        return next();
    }


    const token = req.body['cf-turnstile-response'] || req.headers['x-captcha-token'];

    if (!token) {
        return res.sendError('CAPTCHA token is missing', 400, 'CAPTCHA_MISSING');
    }


    try {
        const formData = new URLSearchParams();
        formData.append('secret', config.turnstileSecretKey);
        formData.append('response', token);
        formData.append('remoteip', req.ip);

        const response = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            formData,
            { timeout: 8000 } // 8s timeout — don't block registration if Cloudflare is slow
        );

        if (response.data.success) {
            return next();
        }

        // Fail-open: log the failure but allow registration to proceed
        // Captcha is a defense layer, not a hard gate for legitimate users
        logger.warn('CAPTCHA verification failed — allowing request (fail-open)', {
            ip: req.ip,
            errors: response.data['error-codes']
        });
        return next();
    } catch (error) {

        // Service error — fail-open so captcha outages don't block all registrations
        logger.error('CAPTCHA service error — allowing request (fail-open)', { error: error.message });
        return next();
    }
};

