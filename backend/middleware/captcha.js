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

    const token = req.body['cf-turnstile-response'] || req.headers['x-captcha-token'];

    if (!token) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'CAPTCHA_MISSING',
                message: 'CAPTCHA token is missing'
            }
        });
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

        return res.status(400).json({
            success: false,
            error: {
                code: 'CAPTCHA_INVALID',
                message: 'CAPTCHA verification failed',
                details: response.data['error-codes']
            }
        });
    } catch (error) {
        logger.error('CAPTCHA service error', { error: error.message });
        // In case of service error, we might want to let the request through 
        // depending on the security requirements. For now, we fail closed.
        return res.status(500).json({
            success: false,
            error: {
                code: 'CAPTCHA_SERVICE_ERROR',
                message: 'Failed to verify CAPTCHA'
            }
        });
    }
};
