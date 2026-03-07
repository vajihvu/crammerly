import { createClient } from 'redis';
import config from '../config/index.js';
import { logger } from './logger.js';

let redisClient = null;

/**
 * Lazily initialises and returns the shared Redis client.
 * Returns null if REDIS_URL is not configured (cache simply disabled).
 */
const getClient = async () => {
    if (!config.redisUrl) return null;

    if (!redisClient) {
        redisClient = createClient({ url: config.redisUrl });

        redisClient.on('error', (err) =>
            logger.error(`Cache Redis error: ${err.message}`)
        );

        await redisClient.connect();
    }

    return redisClient;
};

/**
 * Reads a value from the cache.
 * @param {string} key
 * @returns {Promise<any|null>} Parsed value, or null if missing / Redis unavailable.
 */
export const cacheGet = async (key) => {
    try {
        const client = await getClient();
        if (!client) return null;

        const raw = await client.get(key);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        logger.warn(`Cache GET failed (key: ${key}): ${err.message}`);
        return null; // Fail open — always fall through to DB
    }
};

/**
 * Writes a value into the cache.
 * @param {string} key
 * @param {any} value  — must be JSON-serialisable
 * @param {number} [ttlSeconds=60]
 */
export const cacheSet = async (key, value, ttlSeconds = 60) => {
    try {
        const client = await getClient();
        if (!client) return;

        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (err) {
        logger.warn(`Cache SET failed (key: ${key}): ${err.message}`);
        // Non-fatal — request still succeeds without caching
    }
};

/**
 * Invalidates one or more cache keys.
 * Call this after any write that would stale a cached read.
 * @param {...string} keys
 */
export const cacheInvalidate = async (...keys) => {
    try {
        const client = await getClient();
        if (!client) return;

        await Promise.all(keys.map(k => client.del(k)));
    } catch (err) {
        logger.warn(`Cache invalidation failed: ${err.message}`);
    }
};
