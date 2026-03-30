import express from 'express';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { nosqlSanitize } from './middleware/nosqlSanitize.js';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import config from './config/index.js';
import { requestIdMiddleware, observabilityMiddleware, auditMutationMiddleware } from './middleware/auditMiddleware.js';
// Redundant local rate limiter imports removed in favor of centralized Rate Limiting Suite
// Redis connections managed within the middleware layer


import { protect, authorize } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import v1Routes from './routes/v1.js';
import { depthLimit } from './middleware/security.js';
import { responseEnhancer } from './middleware/responseEnhancer.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { csrfGuard } from './middleware/csrf.js';
import { xssSanitize } from './middleware/xss.js';

const app = express();


// 0. Instrumentation (Sentry first)
if (config.sentryDsn) {
    Sentry.init({
        dsn: config.sentryDsn,
        integrations: [
            nodeProfilingIntegration(),
        ],
        // Performance Monitoring
        tracesSampleRate: config.isProduction ? 0.2 : 1.0,
        // Set sampling rate for profiling - this is relative to tracesSampleRate
        profilesSampleRate: config.isProduction ? 0.2 : 1.0,
        environment: config.env,
        // Privacy Guard: Mask sensitive data before it reaches the Sentry cloud
        beforeSend(event) {
            if (event.request) {
                // 1. Scrub Authorization & Cookies
                if (event.request.headers) {
                    delete event.request.headers['authorization'];
                    delete event.request.headers['cookie'];
                    delete event.request.headers['x-csrf-token'];
                }

                // 2. Scrub Passwords & Tokens from payload
                if (event.request.data) {
                    try {
                        const data = typeof event.request.data === 'string' ? JSON.parse(event.request.data) : event.request.data;
                        const sensitiveFields = ['password', 'token', 'refreshToken', 'secret'];

                        const scrub = (obj) => {
                            if (!obj || typeof obj !== 'object') return;
                            Object.keys(obj).forEach(key => {
                                if (sensitiveFields.some(f => key.toLowerCase().includes(f))) {
                                    obj[key] = '[MASKED]';
                                } else if (typeof obj[key] === 'object') {
                                    scrub(obj[key]);
                                }
                            });
                        };

                        scrub(data);
                        event.request.data = JSON.stringify(data);
                    } catch (_e) {
                        // If parsing fails, just clear the data to be safe
                        event.request.data = '[MALFORMED_DATA_CLEARED]';
                    }
                }
            }
            return event;
        },
    });
    // RequestHandler creates a separate execution context, so that all
    // transactions/spans/breadcrumbs are isolated per request
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
}


// Trust proxy (Render/Nginx/LBs) - Required for secure cookies to work over HTTPS proxies
// SECURITY NOTE: If this app is ever deployed without a reverse proxy (directly exposed),
// change this to the specific proxy IP(s) instead of 1 to prevent req.ip spoofing.
app.set('trust proxy', 1);

// 1. Security Headers (Helmet first)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://plausible.io"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://*.sentry.io", "https://images.unsplash.com", "https://*.googleusercontent.com"],
            connectSrc: ["'self'", ...config.clientUrls, "https://*.sentry.io", "https://plausible.io"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        }
    },
    frameguard: { action: "deny" },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    xssFilter: true,
    noSniff: true
}));

// 2. CORS (Explicit origins)
const corsOptions = {
    origin: config.clientUrls,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
};
app.use(cors(corsOptions));

// 3. Body Parsing & Cookies (Critical Order)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 4. Rate Limiting (Distributed with Redis)
app.use('/api', apiLimiter);

// 5. Observability & Logging
app.use(requestIdMiddleware);
app.use(observabilityMiddleware);
if (config.isDevelopment) {
    app.use(morgan('dev'));
}

// 6. Data Sanitization & Security
app.use(xssSanitize);
app.use(responseEnhancer);
app.use(nosqlSanitize);
app.use(depthLimit(5));
app.use(hpp());


// 7. CSRF Protection (Required for cookie-based refresh/logout)
app.use(csrfGuard);

// 8. Audit Logging (Mutations)
app.use(auditMutationMiddleware);

// 9. API Documentation (Disabled in production for security)
if (!config.isProduction) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        siteTitle: "Crammerly API Docs"
    }));
}



// Routes - Versioned as per API_CONTRACT.md
const API_PREFIX = '/api/v1';
app.use(API_PREFIX, v1Routes);

// Basic health check (Simple version for monitoring/LBs)
app.get('/health', (req, res) => {
    return res.sendSuccess({ status: 'ok' });
});

// Prometheus-compatible metrics endpoint (#22)
// Scrapeable by Prometheus, Render metrics, Grafana Agent, etc.
// Restricted to admin users to prevent server internals exposure
app.get('/metrics', protect, authorize('admin'), (req, res) => {
    const mem = process.memoryUsage();
    const dbState = mongoose.connection.readyState; // 0=disc, 1=conn, 2=connecting, 3=disconnecting

    // Measure event-loop lag
    const start = process.hrtime.bigint();
    setImmediate(() => {
        const lagMs = Number(process.hrtime.bigint() - start) / 1e6;

        const lines = [
            '# HELP nodejs_uptime_seconds Process uptime in seconds',
            '# TYPE nodejs_uptime_seconds gauge',
            `nodejs_uptime_seconds ${process.uptime().toFixed(2)}`,
            '',
            '# HELP nodejs_heap_used_bytes Heap memory used in bytes',
            '# TYPE nodejs_heap_used_bytes gauge',
            `nodejs_heap_used_bytes ${mem.heapUsed}`,
            '',
            '# HELP nodejs_heap_total_bytes Total heap size in bytes',
            '# TYPE nodejs_heap_total_bytes gauge',
            `nodejs_heap_total_bytes ${mem.heapTotal}`,
            '',
            '# HELP nodejs_rss_bytes Resident set size in bytes',
            '# TYPE nodejs_rss_bytes gauge',
            `nodejs_rss_bytes ${mem.rss}`,
            '',
            '# HELP nodejs_external_bytes External memory in bytes',
            '# TYPE nodejs_external_bytes gauge',
            `nodejs_external_bytes ${mem.external}`,
            '',
            '# HELP nodejs_eventloop_lag_ms Event loop lag in milliseconds',
            '# TYPE nodejs_eventloop_lag_ms gauge',
            `nodejs_eventloop_lag_ms ${lagMs.toFixed(3)}`,
            '',
            '# HELP mongodb_connection_state MongoDB readyState (1=connected)',
            '# TYPE mongodb_connection_state gauge',
            `mongodb_connection_state ${dbState}`,
        ];

        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(lines.join('\n') + '\n');
    });
});


/**
 * @openapi
 * /health:
 *   get:
 *     summary: Detailed system health report
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System status
 */
app.get(`${API_PREFIX}/health`, protect, (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    const isHealthy = dbState === 1;

    return res.sendSuccess({
        status: isHealthy ? 'OK' : 'DEGRADED',
        database: dbStatusMap[dbState] || 'unknown',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        memory: {
            heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
        }
    }, isHealthy ? 200 : 503);
});

/**
 * @openapi
 * /me:
 *   get:
 *     summary: Get currently authenticated user
 *     tags: [Authentication]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: User object
 */
app.get(`${API_PREFIX}/me`, protect, (req, res) => {
    return res.sendSuccess(req.user);
});

// Decoupled Deployment: Frontend is served by Netlify/Vercel.
// Backend only handles API requests and health checks.

// 11. Error Handling (Sentry Error Handler first)
if (config.sentryDsn) {
    app.use(Sentry.Handlers.errorHandler());
}

app.use(notFound);
app.use(errorHandler);

export default app;
