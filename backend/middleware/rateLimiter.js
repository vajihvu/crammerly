import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';
import config from '../config/index.js';
import { notifyLoginSpike } from '../utils/securityNotifier.js';

let store;
if (config.redisUrl) {
    const redisClient = createClient({ url: config.redisUrl });
    redisClient.connect().catch(err => console.error('Redis Rate Limit Store Error', err));
    store = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    });
}

/**
 * High-Fidelity Rate Limiting Suite
 * Balanced to prevent brute-force/abuse while ensuring legitimate usage (mobile background refresh).
 */

export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Recommended: 5 logins per minute
    standardHeaders: true,
    legacyHeaders: false,
    store: store,
    skip: () => config.isTest,
    handler: async (req, res, _next, options) => {
        await notifyLoginSpike(req, req.ip);
        res.status(options.statusCode).send(options.message);
    },
    message: {
        success: false,
        error: {
            code: 'AUTH_LOGIN_LIMIT',
            message: 'Too many login attempts. Please wait 1 minute.'
        }
    }
});

export const refreshLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Recommended: 20 per minute to allow background mobile refreshes
    standardHeaders: true,
    legacyHeaders: false,
    store: store,
    skip: () => config.isTest,
    message: {
        success: false,
        error: {
            code: 'AUTH_REFRESH_LIMIT',
            message: 'Excessive background activity. Please wait a moment.'
        }
    }
});

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // General protection for API endpoints
    standardHeaders: true,
    legacyHeaders: false,
    store: store,
    skip: () => config.isTest,
    message: {
        success: false,
        error: {
            code: 'API_LIMIT_REACHED',
            message: 'Global rate limit reached. Back off for 15 minutes.'
        }
    }
});

/**
 * AI Cost-Exhaustion Protection Limiter
 * DeepSeek/AI credits are expensive. This guard prevents a single actor from 
 * draining the API wallet.
 */
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Strictly limit to 5 AI requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    store: store,
    skip: () => config.isTest,
    message: {
        success: false,
        error: {
            code: 'API_AI_QUOTA_EXCEEDED',
            message: 'AI quota exceeded for this hour. Please try again later.'
        }
    }
});

