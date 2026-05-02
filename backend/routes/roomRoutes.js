import express from 'express';
import {
    getAllRooms,
    createRoom,
    joinRoom,
    getRoomByCode,
    deleteRoom,
    leaveRoom,
    updateProgress,
    toggleRoomAdmin
} from '../controllers/roomController.js';
import {
    getTasks, createTask, updateTask, deleteTask, claimTask, assignRole
} from '../controllers/taskController.js';
import {
    getResources, createResource, updateResource, deleteResource
} from '../controllers/resourceController.js';
import { protect } from '../middleware/auth.js';
import { validate, validateParams } from '../middleware/validator.js';
import { roomActionLimiter } from '../middleware/rateLimiter.js';
import { createRoomSchema, updateProgressSchema, joinRoomSchema } from '../schemas/room.schema.js';
import {
    createTaskSchema, updateTaskSchema,
    createResourceSchema, updateResourceSchema,
    assignRoleSchema
} from '../schemas/project.schema.js';
import { mongoIdSchema } from '../schemas/common.schema.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: mongoIdSchema });
const taskIdParamSchema = z.object({ id: mongoIdSchema, taskId: mongoIdSchema });
const resourceIdParamSchema = z.object({ id: mongoIdSchema, resourceId: mongoIdSchema });


const router = express.Router();

router.use(protect);

router.route('/')
    .get(getAllRooms)
    .post(roomActionLimiter, validate(createRoomSchema), createRoom);

router.get('/code/:code', roomActionLimiter, getRoomByCode);
router.post('/:id/join', roomActionLimiter, validateParams(idParamSchema), validate(joinRoomSchema), joinRoom);
router.delete('/:id', validateParams(idParamSchema), deleteRoom);
router.post('/:id/leave', validateParams(idParamSchema), leaveRoom);
router.put('/:id/progress', validateParams(idParamSchema), validate(updateProgressSchema), updateProgress);
router.put('/:id/members/:memberId/admin', validateParams(idParamSchema), toggleRoomAdmin);

// ── Task Card Routes (Project Channels) ──
router.get('/:id/tasks', validateParams(idParamSchema), getTasks);
router.post('/:id/tasks', validateParams(idParamSchema), validate(createTaskSchema), createTask);
router.put('/:id/tasks/:taskId', validateParams(taskIdParamSchema), validate(updateTaskSchema), updateTask);
router.delete('/:id/tasks/:taskId', validateParams(taskIdParamSchema), deleteTask);
router.put('/:id/tasks/:taskId/claim', validateParams(taskIdParamSchema), claimTask);

// ── Role Assignment (Project Channels) ──
router.put('/:id/members/:memberId/role', validateParams(idParamSchema), validate(assignRoleSchema), assignRole);

// ── Resource Library Routes (Project Channels) ──
router.get('/:id/resources', validateParams(idParamSchema), getResources);
router.post('/:id/resources', validateParams(idParamSchema), validate(createResourceSchema), createResource);
router.put('/:id/resources/:resourceId', validateParams(resourceIdParamSchema), validate(updateResourceSchema), updateResource);
router.delete('/:id/resources/:resourceId', validateParams(resourceIdParamSchema), deleteResource);



export default router;
