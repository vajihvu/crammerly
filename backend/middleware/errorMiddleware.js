import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';
import { ZodError } from 'zod';

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

    // Handle Zod errors (checking by name AND issues to be super safe)
    if (err instanceof ZodError || err.name === 'ZodError' || err.issues) {
        statusCode = 400;
        code = 'VAL_SCHEMA_FAIL';
        details = err.errors || err.issues;
        
        if (details && details.length > 0) {
            // Find all password-related errors
            const passwordErrors = details.filter(d => 
                (d.path && d.path.includes('password')) || 
                (d.message && d.message.toLowerCase().includes('password'))
            );
            
            let otherMessages = details
                .filter(d => !passwordErrors.includes(d))
                .map(d => d.message);
                
            // Deduplicate to ensure we don't spam repeated strings
            otherMessages = [...new Set(otherMessages)];
            
            if (passwordErrors.length > 0) {
                const pwdMsg = 'Password must consist of at least 10 characters, an uppercase character, a lowercase character, a number, and a special symbol.';
                message = [pwdMsg, ...otherMessages].filter(Boolean).join(' ');
            } else {
                message = otherMessages.filter(Boolean).join(' ');
            }
        } else {
            message = 'Ensure all required fields are correctly filled according to the requirements.';
        }
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
            requestId: req.requestId,
            ...err.meta
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

    if (statusCode === 500 && config.isTest) {
        console.error('CRITICAL 500 ERROR:', err);
    }

    res.status(statusCode).json(errorPayload);
};

/**
 * 404 Not Found Middleware
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    error.code = 'RES_NOT_FOUND';
    next(error);
};
