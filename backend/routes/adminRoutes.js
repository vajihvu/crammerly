import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { getUsers, toggleUserStatus, updateUserRole } from '../controllers/adminController.js';

const router = express.Router();

// All routes here require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);

export default router;
