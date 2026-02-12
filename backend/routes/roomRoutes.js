import express from 'express';
import {
    getAllRooms,
    createRoom,
    joinRoom,
    getRoomByCode,
    deleteRoom,
    updateProgress
} from '../controllers/roomController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getAllRooms)
    .post(createRoom);

router.get('/code/:code', getRoomByCode);
router.post('/:id/join', joinRoom);
router.delete('/:id', deleteRoom);
router.put('/:id/progress', updateProgress);

export default router;
