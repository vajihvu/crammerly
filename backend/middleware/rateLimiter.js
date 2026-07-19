import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createClient } from 'redis';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { notifyLoginSpike } from '../utils/securityNotifier.js';

// Initialize Redis Client once
let redisClient;
if (config.redisUrl) {
    redisClient = createClient({ url: config.redisUrl });
    redisClient.on('error', err => logger.error(`Redis Rate Limit client error: ${err.message}`));
    redisClient.connect().catch(err => logger.error(`Redis Rate Limit Store connection failed: ${err.message}`));
}

/**
 * Creates a new RedisStore instance with a unique prefix.
 * This satisfies the 'one store per limiter' requirement in express-rate-limit v7+.
 */
const createStore = (name) => {
    if (!redisClient) return undefined;
    
    return new RedisStore({
        prefix: `rl:${name}:`,
        sendCommand: async (...args) => {
            try {
                // rate-limit-redis passes an array of strings to sendCommand.
                // node-redis (v4+) sendCommand expects a single array of strings.
                return await redisClient.sendCommand(args);
            } catch (err) {
                logger.warn(`Redis store (${name}) failed, falling back to memory: ${err.message}`);
                throw err;
            }
        },
    });
};

/**
 * Enhanced Login Limiter
 * Protects against brute-force attacks on auth endpoints.
 */
export const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('login'),
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

/**
 * Background Refresh Limiter
 * Limits silent token rotations to prevent session flooding.
 */
export const refreshLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('refresh'),
    skip: () => config.isTest,
    message: {
        success: false,
        error: {
            code: 'AUTH_REFRESH_LIMIT',
            message: 'Excessive background activity. Please wait a moment.'
        }
    }
});

/**
 * Global API Limiter
 * General protection for public/authenticated endpoints.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('api'),
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
 * AI Quota Limiter
 * Cost-exhaustion protection for LLM endpoints.
 * Limits by user ID if logged in, otherwise falls back to IP.
 */
export const aiLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('ai'),
    keyGenerator: (req) => {
        // use user id if available for highly targeted limiting
        if (req.user?._id) return req.user._id.toString();
        // fallback to default IP-based key if no user
        return req.ip; 
    },
    skip: (req) => config.isTest || (req.user && req.user.role === 'admin'),
    validate: { xForwardedForHeader: false, default: true, ip: false }, // Avoid the IP warning if we trust the environment
    message: {
        success: false,
        error: {
            code: 'API_AI_QUOTA_EXCEEDED',
            message: 'Daily AI quota exceeded (5 prompts/day). Please try again tomorrow.'
        }
    }
});

/**
 * Room Action Limiter
 * Protects against brute-force room creation and join code guessing.
 */
export const roomActionLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 requests per 10 minutes
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('room_action'),
    skip: () => config.isTest,
    message: {
        success: false,
        error: {
            code: 'ROOM_ACTION_LIMIT',
            message: 'Too many room creations or join attempts. Please wait 10 minutes.'
        }
    }
});


