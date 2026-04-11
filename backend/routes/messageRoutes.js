import express from 'express';
import { getMessagesByRoom, sendMessage, markAsRead, uploadFile } from '../controllers/messageController.js';
import { upload } from '../middleware/upload.js';

import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { messageSchema } from '../schemas/message.schema.js';

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);

router.route('/:roomId')
    .get(getMessagesByRoom)
    .post(validate(messageSchema), sendMessage)
    .patch(markAsRead);

export default router;

