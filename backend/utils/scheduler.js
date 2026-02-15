import { cleanupQueue } from './queue.js';
import { logger } from './logger.js';
import config from '../config/index.js';

/**
 * Initializes recurring background tasks
 */
export const initBackgroundJobs = async () => {
    try {
        if (!config.redisUrl) {
            logger.warn('⚠️ REDIS_URL not found. Skipping background job scheduling.');
            return;
        }

        // 1. Session Cleanup - Every 24 hours
        await cleanupQueue.add('SESSION_CLEANUP', {}, {
            repeat: {
                pattern: '0 0 * * *' // Midnight every day
            }
        });

        logger.info('⏰ Recurring background jobs scheduled');
    } catch (error) {
        logger.error('Failed to schedule background jobs:', { error: error.message });
    }
};
