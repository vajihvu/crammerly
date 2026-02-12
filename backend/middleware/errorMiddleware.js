import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const ERROR_HINTS = {
    'AUTH_INVALID': 'Double check your email and password, or try resetting it.',
    'SEC_SESSION_ANOMALY': 'Your session was revoked due to a security mismatch. Please login again.',
    'SEC_PWD_BREACHED': 'This password appeared in a public data breach. Using it puts your account at risk.',
    'RES_DUPLICATE': 'Try using a different unique identifier.',
    'VAL_SCHEMA_FAIL': 'Ensure all required fields are correctly filled according to the requirements.',
    'AUTH_EXPIRED': 'Your session has expired. Please login again to continue.',
    'SEC_PWD_REUSE': 'You cannot reuse a recent password. Please choose a new unique one.'
};

/**
 * Global Error Handler Middleware
 */
export const errorHandler = (err, req, res, _next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let code = 'SYS_INTERNAL';
    let message = err.message || 'An unexpected error occurred';
    let details = [];

    // 1. Detection: Error Grouping
    // Create a group hash to identify recurring issues
    const errorHash = crypto.createHash('md5')
        .update(`${err.message}${err.stack || ''}`)
        .digest('hex')
        .substring(0, 8);

    // Handle Mongoose Validation Errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        code = 'VAL_SCHEMA_FAIL';
        details = Object.values(err.errors).map(val => ({ field: val.path, message: val.message }));
        message = 'Validation failed';
    }

    // Handle Mongoose Cast Error (Invalid ID)
    if (err.name === 'CastError') {
        statusCode = 400;
        code = 'RES_NOT_FOUND';
        message = 'Invalid resource format';
    }

    // Handle Duplicate Key Error
    if (err.code === 11000) {
        statusCode = 400;
        code = 'RES_DUPLICATE';
        message = 'This entry already exists';
    }

    // Handle Zod errors
    if (err.name === 'ZodError') {
        statusCode = 400;
        code = 'VAL_SCHEMA_FAIL';
        details = err.errors;
    }

    // Support custom error codes
    if (err.statusCode) statusCode = err.statusCode;
    if (err.code && typeof err.code === 'string') code = err.code;

    const errorPayload = {
        success: false,
        error: {
            code,
            http: statusCode,
            message,
            groupHash: errorHash,
            hint: ERROR_HINTS[code],
            details: details.length > 0 ? details : undefined,
            stack: config.isProduction ? null : err.stack
        },
        meta: {
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            requestId: req.requestId
        }
    };

    // Log the error with structured context
    logger.error(`Error Handler: [${code}] ${message}`, {
        requestId: req.requestId,
        groupHash: errorHash,
        statusCode,
        path: req.originalUrl,
        stack: err.stack
    });

    res.status(statusCode).json(errorPayload);
};

/**
 * 404 Not Found Middleware
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
