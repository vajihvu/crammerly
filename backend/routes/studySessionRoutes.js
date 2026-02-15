import express from 'express';
import {
    startSession,
    endSession,
    getSessions,
    getStats
} from '../controllers/studySessionController.js';
import { protect } from '../middleware/auth.js';
import { validate, validateParams } from '../middleware/validator.js';
import { startSessionSchema, endSessionSchema } from '../schemas/session.schema.js';
import { mongoIdSchema } from '../schemas/common.schema.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: mongoIdSchema });

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /study-sessions:
 *   get:
 *     tags: [Study Sessions]
 *     summary: Get all study sessions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/', getSessions);

/**
 * @openapi
 * /study-sessions/start:
 *   post:
 *     tags: [Study Sessions]
 *     summary: Start a new study session
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Session started
 */
router.post('/start', validate(startSessionSchema), startSession);

/**
 * @openapi
 * /study-sessions/{id}/end:
 *   put:
 *     tags: [Study Sessions]
 *     summary: End an active study session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Session ended
 */
router.put('/:id/end', validateParams(idParamSchema), validate(endSessionSchema), endSession);

/**
 * @openapi
 * /study-sessions/stats:
 *   get:
 *     tags: [Study Sessions]
 *     summary: Get study metrics/stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Study statistics
 */
router.get('/stats', getStats);

export default router;
