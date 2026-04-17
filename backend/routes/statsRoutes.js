import express from 'express';
import User from '../models/User.js';
import { getIO } from '../utils/socket.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @openapi
 * /stats/public:
 *   get:
 *     summary: Get public application statistics
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Public stats
 */
router.get('/public', async (req, res) => {
    try {
        let activeUsers = 0;
        try {
            const io = getIO();
            // Get number of connected sockets
            activeUsers = io.sockets.sockets.size;
        } catch (_err) {
            // Socket might not be initialized yet
            logger.warn('Socket.io not initialized when fetching stats');
        }

        // Count total users in DB
        const totalUsers = await User.countDocuments();

        // Simulate countries (base 180 + small variance based on total users)
        const countries = 180 + Math.floor(totalUsers / 1000);

        res.status(200).json({
            success: true,
            data: {
                activeUsers,
                totalUsers,
                countries: `${countries}+`
            }
        });
    } catch (error) {
        logger.error(`Failed to fetch public stats: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
