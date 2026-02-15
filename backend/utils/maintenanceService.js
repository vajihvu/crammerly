import Session from '../models/Session.js';
import Todo from '../models/Todo.js';
import Record from '../models/Record.js';
import User from '../models/User.js';
import { logger } from './logger.js';

/**
 * Data Maintenance Service
 * Responsible for background cleanup and consistency checks.
 */

export const runCleanups = async () => {
    logger.info('🧹 Starting background maintenance jobs...');
    const startAt = Date.now();

    try {
        // 1. Cleanup: Expired/Invalid Sessions
        // Mongoose TTL index handles expiration, but we manually 
        // purge sessions marked as invalid/suspicious older than 30 days.
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sessionResult = await Session.deleteMany({
            isValid: false,
            revokedAt: { $lt: thirtyDaysAgo }
        });

        if (sessionResult.deletedCount > 0) {
            logger.info(`Cleaned up ${sessionResult.deletedCount} old invalid sessions.`);
        }

        // 2. Consistency: Orphan Record Detection
        // Detect records belonging to users that no longer exist (e.g. hard delete failures)
        const allUsers = await User.find({}, '_id');
        const userIds = allUsers.map(u => u._id);

        const orphanTodos = await Todo.deleteMany({ user_id: { $nin: userIds } });
        const orphanRecords = await Record.deleteMany({ userId: { $nin: userIds } });

        if (orphanTodos.deletedCount > 0 || orphanRecords.deletedCount > 0) {
            logger.warn('Detected and cleaned orphan records:', {
                todos: orphanTodos.deletedCount,
                records: orphanRecords.deletedCount
            });
        }

        const duration = Date.now() - startAt;
        logger.info(`✅ Maintenance jobs completed in ${duration}ms.`);
    } catch (error) {
        logger.error('CRITICAL: Maintenance job failed', { error: error.message });
    }
};

/**
 * Start periodic maintenance
 * Default: Every 24 hours
 */
export const startMaintenanceScheduler = (intervalMs = 24 * 60 * 60 * 1000) => {
    logger.info(`Scheduler started. Maintenance running every ${intervalMs / (60 * 60 * 1000)} hours.`);

    // Run immediately on boot
    setTimeout(runCleanups, 5000);

    return setInterval(runCleanups, intervalMs);
};
