import express from 'express';
import { getSessions, revokeSession } from '../controllers/sessionController.js';
import { protect } from '../middleware/auth.js';
import { validateParams } from '../middleware/validator.js';
import { mongoIdSchema } from '../schemas/common.schema.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: mongoIdSchema });

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /sessions:
 *   get:
 *     tags:
 *       - Security
 *     summary: List active sessions
 *     description: Returns all valid, unexpired sessions for the authenticated user.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
router.get('/', getSessions);

/**
 * @openapi
 * /sessions/{id}:
 *   delete:
 *     tags:
 *       - Security
 *     summary: Revoke a session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.delete('/:id', validateParams(idParamSchema), revokeSession);

export default router;
