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

    // Safety: If secret key is missing in production, log critical error but let users through 
    // to avoid blocking all traffic due to configuration error.
    if (!config.turnstileSecretKey) {
        logger.error('CRITICAL ERROR: Cloudflare Turnstile secret key is missing in production!');
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
            formData
        );

        if (response.data.success) {
            return next();
        }

        logger.warn('CAPTCHA verification failed', {
            ip: req.ip,
            errors: response.data['error-codes']
        });

        return res.sendError('CAPTCHA verification failed', 400, 'CAPTCHA_INVALID');
    } catch (error) {

        logger.error('CAPTCHA service error', { error: error.message });
        // In case of service error, we might want to let the request through 
        // depending on the security requirements. For now, we fail closed.
        return res.sendError('Failed to verify CAPTCHA', 500, 'CAPTCHA_SERVICE_ERROR');
    }
};

