import express from 'express';
import { getMessagesByRoom, sendMessage } from '../controllers/messageController.js';

import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { messageSchema } from '../schemas/message.schema.js';

const router = express.Router();

router.use(protect);

router.route('/:roomId')
    .get(getMessagesByRoom)
    .post(validate(messageSchema), sendMessage);

export default router;

