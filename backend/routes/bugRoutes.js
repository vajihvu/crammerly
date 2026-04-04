import express from 'express';
import { createBugReport, getBugReports } from '../controllers/bugController.js';
import { protect, authorize } from '../middleware/auth.js';
import { csrfGuard } from '../middleware/csrf.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.route('/')
    .post(protect, csrfGuard, apiLimiter, createBugReport)
    .get(protect, authorize('admin'), getBugReports);

export default router;
