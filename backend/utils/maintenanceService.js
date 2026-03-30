import Session from '../models/Session.js';
import Todo from '../models/Todo.js';
import Record from '../models/Record.js';
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
        // Uses aggregation pipeline to find records with no matching user — avoids loading all user IDs into memory
        const [orphanTodoResult] = await Todo.aggregate([
            { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'owner' } },
            { $match: { owner: { $size: 0 } } },
            { $count: 'count' }
        ]);
        const orphanTodoCount = orphanTodoResult?.count || 0;

        const [orphanRecordResult] = await Record.aggregate([
            { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'owner' } },
            { $match: { owner: { $size: 0 } } },
            { $count: 'count' }
        ]);
        const orphanRecordCount = orphanRecordResult?.count || 0;

        if (orphanTodoCount > 0 || orphanRecordCount > 0) {
            // Only delete if orphans exist
            await Todo.aggregate([
                { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'owner' } },
                { $match: { owner: { $size: 0 } } },
                { $project: { _id: 1 } }
            ]).then(async (docs) => {
                if (docs.length > 0) await Todo.deleteMany({ _id: { $in: docs.map(d => d._id) } });
            });
            await Record.aggregate([
                { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'owner' } },
                { $match: { owner: { $size: 0 } } },
                { $project: { _id: 1 } }
            ]).then(async (docs) => {
                if (docs.length > 0) await Record.deleteMany({ _id: { $in: docs.map(d => d._id) } });
            });

            logger.warn('Detected and cleaned orphan records:', {
                todos: orphanTodoCount,
                records: orphanRecordCount
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
