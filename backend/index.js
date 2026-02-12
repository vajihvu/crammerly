const startTime = process.hrtime();
import mongoose from 'mongoose';
import app from './app.js';
import config from './config/index.js';
import { logger } from './utils/logger.js';
import { performancePlugin } from './middleware/performancePlugin.js';
import { startMaintenanceScheduler } from './utils/maintenanceService.js';
import { initSocket } from './utils/socket.js';

// Apply global mongoose performance tracking
mongoose.plugin(performancePlugin);

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Database Connection Error: ${error.message}`);
        process.exit(1);
    }
};

// Startup Self-Test (Sanity checks)
const startupSelfTest = async () => {
    logger.info('🔍 Running startup self-tests...', { env: config.env });
    try {
        // Test 1: Verify Mongo URI format
        if (!config.mongoUri.startsWith('mongodb')) throw new Error('Invalid MONGO_URI format');

        // Test 2: Verify JWT Secret strength (if in production)
        if (config.isProduction && config.jwt.secret.length < 32) {
            throw new Error('JWT_SECRET too weak for production');
        }

        logger.info('✅ Startup self-tests passed.');
    } catch (error) {
        logger.error('❌ Startup self-test FAILED', { error: error.message });
        process.exit(1);
    }
};

let server;

// Start server after DB connection
const startServer = async () => {
    await startupSelfTest();

    if (!config.isTest) {
        await connectDB();
        startMaintenanceScheduler();
    }

    server = app.listen(config.port, () => {
        const diff = process.hrtime(startTime);
        const coldStartTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

        logger.info(`🚀 Server running on port ${config.port}`, {
            env: config.env,
            coldStartTimeMs: parseFloat(coldStartTime)
        });
    });

    // Initialize Socket.io
    initSocket(server);

    // Graceful Shutdown Handler
    const shutdown = async (signal) => {
        logger.info(`Termination signal (${signal}) received. Starting graceful shutdown...`);

        if (server) {
            await new Promise((resolve) => {
                server.close(() => {
                    logger.info('🔌 HTTP server closed.');
                    resolve();
                });
            });
        }

        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                logger.info('📦 MongoDB connection closed.');
            }
            logger.info('👋 Graceful shutdown complete.');
            process.exit(0);
        } catch (error) {
            logger.error('Error during shutdown', { error: error.message });
            process.exit(1);
        }
    };

    // Handle process events
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', { promise, reason: reason instanceof Error ? reason.message : reason });
        // Recommended: shutdown gracefully on unhandled rejections in production
        if (config.isProduction) shutdown('unhandledRejection');
    });

    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
        shutdown('uncaughtException');
    });
};

startServer();
