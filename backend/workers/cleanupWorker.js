import { Worker } from 'bullmq';
import config from '../config/index.js';
import Session from '../models/Session.js';
import { logger } from '../utils/logger.js';

let worker;

if (config.redisUrl) {
    const connection = {
        url: config.redisUrl
    };

    worker = new Worker('cleanup', async (job) => {
        if (job.name === 'SESSION_CLEANUP') {
            logger.info('Running background session cleanup...');

            // Example: Log suspicious sessions before they are naturally deleted by MongoDB
            const suspicious = await Session.find({ isSuspicious: true, isValid: false });
            if (suspicious.length > 0) {
                logger.warn(`Found ${suspicious.length} suspicious revoked sessions during cleanup.`);
            }

            // Force delete sessions revoked more than 30 days ago (if not already handled by TTL)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const result = await Session.deleteMany({
                isValid: false,
                revokedAt: { $lt: thirtyDaysAgo }
            });

            return { deletedCount: result.deletedCount, suspiciousCount: suspicious.length };
        }
    }, { connection });

    worker.on('completed', (job) => {
        logger.info(`Cleanup job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Cleanup job ${job.id} failed: ${err.message}`);
    });
} else {
    logger.warn('⚠️ REDIS_URL not found. Background worker "cleanup" disabled.');
}

export default worker;
