import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import config from './config/index.js';
import { requestIdMiddleware, observabilityMiddleware, auditMutationMiddleware } from './middleware/auditMiddleware.js';

import { protect } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/authRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import studySessionRoutes from './routes/studySessionRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { depthLimit } from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Trust proxy for correct IP detection behind LBs/CDNs
app.set('trust proxy', true);

// 1. Security Headers (Helmet first)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://validator.swagger.io"],
            connectSrc: ["'self'", "https://api.deepseek.com"],
        },
    },
    referrerPolicy: { policy: 'same-origin' },
    strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// 2. CORS (Explicit origins)
const corsOptions = {
    origin: [config.clientUrl, 'https://crammerly.io', 'https://www.crammerly.io'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// 3. Global Rate limiting (Before body parsing to avoid DoS)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.isTest,
    message: {
        success: false,
        error: {
            code: 'AUTH_TOO_MANY_REQUESTS',
            message: 'Too many requests from this IP, please try again after 15 minutes'
        }
    }
});
app.use('/api', limiter);

// 4. Observability & Logging
app.use(requestIdMiddleware);
app.use(observabilityMiddleware);
if (config.isDevelopment) {
    app.use(morgan('dev'));
}

// 5. Body Parsers & Data Sanitization
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));
app.use(depthLimit(5));
app.use(hpp());

// 6. Contracts & Meta information (v1 Compliance)
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && data && typeof data === 'object') {
            if (!data.meta) {
                data.meta = {
                    timestamp: new Date().toISOString(),
                    path: req.originalUrl,
                    version: 'v1',
                    requestId: req.requestId
                };
            }
        }
        return originalJson.call(this, data);
    };
    next();
});

// 7. Audit Logging (Mutations)
app.use(auditMutationMiddleware);

// 8. API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    siteTitle: "Crammerly API Docs"
}));

// 8. Authentication Throttling (Extra protection for Auth endpoints)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.isTest,
    message: {
        success: false,
        error: {
            code: 'AUTH_TOO_MANY_REQUESTS',
            message: 'Too many authentication attempts. Please try again in an hour.'
        }
    }
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Routes - Versioned as per API_CONTRACT.md
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/records`, recordRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);
app.use(`${API_PREFIX}/todos`, todoRoutes);
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.use(`${API_PREFIX}/study-sessions`, studySessionRoutes);
app.use(`${API_PREFIX}/rooms`, roomRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);

// Basic health check (Simple version for monitoring/LBs)
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
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
app.get(`${API_PREFIX}/health`, (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    const isHealthy = dbState === 1;

    res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        data: {
            status: isHealthy ? 'OK' : 'DEGRADED',
            database: dbStatusMap[dbState] || 'unknown',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB'
            }
        }
    });
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
    res.json({ success: true, data: req.user });
});

// Serve frontend static files in production
if (config.isProduction) {
    const distPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(distPath));

    // Handle SPA routing: Express 5 safe catch-all
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            next();
        }
    });
}

// Error Handling
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

export default app;
