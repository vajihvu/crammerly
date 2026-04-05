import express from 'express';
import authRoutes from './authRoutes.js';
import recordRoutes from './recordRoutes.js';
import aiRoutes from './aiRoutes.js';
import todoRoutes from './todoRoutes.js';
import studySessionRoutes from './studySessionRoutes.js';
import roomRoutes from './roomRoutes.js';
import messageRoutes from './messageRoutes.js';
import bugRoutes from './bugRoutes.js';
import friendsRoutes from './friendsRoutes.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * API Version 1 Gateway
 * This router aggregates all v1 routes, ensuring unified prefix application
 * and allowing for future versions (v2, etc.) to be side-loaded cleanly.
 */

router.use('/auth', authRoutes);
router.use('/records', recordRoutes);
router.use('/ai', aiLimiter, aiRoutes);
router.use('/todos', todoRoutes);
router.use('/study-sessions', studySessionRoutes);
router.use('/rooms', roomRoutes);
router.use('/messages', messageRoutes);
router.use('/bugs', bugRoutes);
router.use('/friends', friendsRoutes);

export default router;
