import express from 'express';
import {
    searchFriends,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    getFriendsList
} from '../controllers/friendController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth protection securely across all friends functionality
router.use(protect);

router.get('/search', searchFriends);
router.post('/request', sendFriendRequest);
router.post('/accept/:id', acceptFriendRequest);
router.delete('/:id', removeFriend);
router.get('/', getFriendsList);

export default router;
