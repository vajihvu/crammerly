import { Worker } from 'bullmq';
import config from '../config/index.js';
import Session from '../models/Session.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { logger } from '../utils/logger.js';
import { broadcastGlobal } from '../utils/socket.js';

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

        if (job.name === 'ROOM_CLEANUP') {
            logger.info('Running background stale room cleanup...');
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            
            // Find active rooms that are empty and older than 15 mins. (Skip strictly scheduled future rooms)
            const d = new Date();
            const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            const staleRooms = await Room.find({
                members: { $size: 0 },
                createdAt: { $lt: fifteenMinutesAgo },
                $or: [
                    { scheduleDate: { $exists: false } }, // Not scheduled
                    { scheduleDate: null },
                    { scheduleDate: { $lte: today } } // Scheduled for today or past
                ]
            });

            if (staleRooms.length === 0) return { deletedCount: 0 };

            logger.info(`Found ${staleRooms.length} stale rooms to clean up.`);

            let count = 0;
            for (const room of staleRooms) {
                // Delete associated messages
                await Message.deleteMany({ roomId: room._id });
                
                // Track details for sockets
                const roomId = room._id.toString();
                const roomName = room.name;
                
                // Delete the room
                await room.deleteOne();

                // Broadcast deletion globally to update all dashboards
                try {
                    broadcastGlobal('room_deleted', {
                        roomId: roomId,
                        roomName: roomName,
                        deletedBy: 'System Cleanup'
                    });
                } catch (e) {
                     logger.warn(`Failed to broadcast room deletion for room ${roomId}: ${e.message}`);
                }
                count++;
            }

            return { deletedCount: count };
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
