import { v4 as uuidv4 } from 'uuid';
import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to attach a unique Request ID to every request and response
 * Supports correlation IDs passed from the frontend
 */
export const requestIdMiddleware = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
};

/**
 * Observability Middleware
 * Measures request latency, payload sizes, and logs request completion
 */
export const observabilityMiddleware = (req, res, next) => {
    const startAt = process.hrtime();
    const payloadSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0;

    // Track response finish
    res.on('finish', () => {
        const diff = process.hrtime(startAt);
        const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            requestId: req.requestId,
            durationMs: parseFloat(durationMs),
            payloadSize,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };

        if (res.statusCode >= 500) {
            logger.error(`Request Failed: ${req.method} ${req.originalUrl}`, logData);
        } else if (res.statusCode >= 400) {
            logger.warn(`Request Warning: ${req.method} ${req.originalUrl}`, logData);
        } else {
            logger.info(`Request Completed: ${req.method} ${req.originalUrl}`, logData);
        }
    });

    next();
};

const SENSITIVE_FIELDS = ['password', 'token', 'refreshToken', 'secret', 'key', 'auth', 'authorization', 'cookie', 'xsrf', 'csrf'];

const scrubSensitiveData = (data) => {
    if (!data || typeof data !== 'object') return data;

    const scrubbed = Array.isArray(data) ? [...data] : { ...data };

    for (const key in scrubbed) {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            scrubbed[key] = '[REDACTED]';
        } else if (typeof scrubbed[key] === 'object') {
            scrubbed[key] = scrubSensitiveData(scrubbed[key]);
        }
    }

    return scrubbed;
};

/**
 * Utility to record an audit event to the database
 */
export const logAuditEvent = async ({
    req,
    user = null,
    event,
    status,
    metadata = {}
}) => {
    try {
        const scrubbedMetadata = scrubSensitiveData(metadata);

        await AuditLog.create({
            user: user || req.user?._id,
            event,
            status,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            requestId: req.requestId,
            metadata: scrubbedMetadata
        });
    } catch (error) {
        logger.error('CRITICAL: Audit logging failed', {
            requestId: req.requestId,
            errorMessage: error.message
        });
    }
};

/**
 * Automatic Audit Middleware for Mutations
 * Captures all POST, PUT, DELETE operations that were successful
 */
export const auditMutationMiddleware = (req, res, next) => {
    // Only log mutations (writes)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Attach listeners to capture successful responses
    res.on('finish', () => {
        // Only log successful modifications (2xx) or specific security failures (detected elsewhere)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            const eventType = `${req.method}_${req.originalUrl.split('/')[3]?.toUpperCase() || 'SYSTEM'}_WRITE`;

            // We don't await this to avoid slowing down the response cycle
            logAuditEvent({
                req,
                event: eventType,
                status: 'SUCCESS',
                metadata: {
                    path: req.originalUrl,
                    method: req.method,
                    // Optionally scrub and log body for non-sensitive routes
                    body: req.originalUrl.includes('auth') ? undefined : scrubSensitiveData(req.body)
                }
            });
        }
    });

    next();
};
