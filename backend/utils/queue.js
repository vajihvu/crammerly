import { Queue } from 'bullmq';
import config from '../config/index.js';

const connection = config.redisUrl ? { url: config.redisUrl } : null;

// 1. Cleanup Queue
export const cleanupQueue = connection ? new Queue('cleanup', { connection }) : null;

// 2. Notification Queue (Future use)
export const notificationQueue = connection ? new Queue('notifications', { connection }) : null;

if (connection) {
    console.log('🚀 Background queues initialized');
} else {
    console.warn('⚠️ REDIS_URL not found. Background queues disabled.');
}
