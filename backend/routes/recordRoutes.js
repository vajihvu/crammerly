import express from 'express';
import {
    getRecords,
    createRecord,
    getRecordById,
    updateRecord,
    deleteRecord,
} from '../controllers/recordController.js';
import { protect } from '../middleware/auth.js';
import { validate, validateParams } from '../middleware/validator.js';
import { recordSchema, updateRecordSchema } from '../schemas/record.schema.js';
import { mongoIdSchema } from '../schemas/common.schema.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: mongoIdSchema });


const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @openapi
 * /records:
 *   get:
 *     tags: [Records]
 *     summary: Fetch user records with pagination
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated records
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
router.route('/')
    .get(getRecords)
    /**
     * @openapi
     * /records:
     *   post:
     *     tags: [Records]
     *     summary: Create new record
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [title, content]
     *             properties:
     *               title: { type: string }
     *               content: { type: string }
     *               status: { type: string, enum: [draft, published, archived] }
     *               tags: { type: array, items: { type: string } }
     *     responses:
     *       201:
     *         description: Record created
     */
    .post(validate(recordSchema), createRecord);

/**
 * @openapi
 * /records/{id}:
 *   get:
 *     tags: [Records]
 *     summary: Get single record details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Record details
 *   put:
 *     tags: [Records]
 *     summary: Update record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Record updated
 *   delete:
 *     tags: [Records]
 *     summary: Remove record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Record removed
 */
router.route('/:id')
    .get(validateParams(idParamSchema), getRecordById)
    .put(validateParams(idParamSchema), validate(updateRecordSchema), updateRecord)
    .delete(validateParams(idParamSchema), deleteRecord);


export default router;
