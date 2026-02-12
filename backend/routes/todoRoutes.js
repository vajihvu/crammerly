import express from 'express';
import { getTodos, createTodo, toggleTodo, deleteTodo } from '../controllers/todoController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { todoSchema } from '../schemas/common.schema.js';

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /todos:
 *   get:
 *     tags: [Todos]
 *     summary: Fetch all user todos
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of todos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 */
router.route('/')
    .get(getTodos)
    /**
     * @openapi
     * /todos:
     *   post:
     *     tags: [Todos]
     *     summary: Create new todo
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [text]
     *             properties:
     *               text: { type: string, example: "Buy milk" }
     *     responses:
     *       201:
     *         description: Todo created
     */
    .post(validate(todoSchema), createTodo);

/**
 * @openapi
 * /todos/{id}:
 *   put:
 *     tags: [Todos]
 *     summary: Toggle todo completion
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Todo updated
 */
router.route('/:id')
    .put(toggleTodo)
    /**
     * @openapi
     * /todos/{id}:
     *   delete:
     *     tags: [Todos]
     *     summary: Remove todo
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema: { type: string }
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Todo removed
     */
    .delete(deleteTodo);

export default router;
