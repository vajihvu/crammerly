import express from 'express';
import { getMessagesByRoom, sendMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/:roomId')
    .get(getMessagesByRoom)
    .post(sendMessage);

export default router;
