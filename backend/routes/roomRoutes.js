import express from 'express';
import {
    getAllRooms,
    createRoom,
    joinRoom,
    getRoomByCode,
    deleteRoom,
    leaveRoom,
    updateProgress
} from '../controllers/roomController.js';
import { protect } from '../middleware/auth.js';
import { validate, validateParams } from '../middleware/validator.js';
import { createRoomSchema, updateProgressSchema, joinRoomSchema } from '../schemas/room.schema.js';
import { mongoIdSchema } from '../schemas/common.schema.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: mongoIdSchema });


const router = express.Router();

router.use(protect);

router.route('/')
    .get(getAllRooms)
    .post(validate(createRoomSchema), createRoom);

router.get('/code/:code', getRoomByCode);
router.post('/:id/join', validateParams(idParamSchema), validate(joinRoomSchema), joinRoom);
router.delete('/:id', validateParams(idParamSchema), deleteRoom);
router.post('/:id/leave', validateParams(idParamSchema), leaveRoom);
router.put('/:id/progress', validateParams(idParamSchema), validate(updateProgressSchema), updateProgress);



export default router;
