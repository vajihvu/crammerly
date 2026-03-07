import winston from 'winston';
import config from '../config/index.js';

// Keys to redact from logs for security/compliance
const REDACT_KEYS = [
    'password', 'token', 'refreshToken', 'JWT_SECRET', 'MONGO_URI',
    'DEEPSEEK_API_KEY', 'x-csrf-token', 'xsrf', 'csrf', 'cookie',
    'SENTRY_DSN', 'VITE_SENTRY_DSN'
];

const redact = winston.format((info) => {
    const result = { ...info };

    // Recursive redaction helper
    const scrub = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        Object.keys(obj).forEach(key => {
            if (REDACT_KEYS.includes(key)) {
                obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
                scrub(obj[key]);
            }
        });
    };

    scrub(result);
    return result;
});

const logger = winston.createLogger({
    level: config.isDevelopment ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        redact(),
        config.isProduction ? winston.format.json() : winston.format.prettyPrint()
    ),
    defaultMeta: { service: 'crammerly-backend', env: config.env },

    transports: [
        new winston.transports.Console()
    ]
});

// Polyfill old logger interface to ensure compatibility
export { logger };
export default logger;
