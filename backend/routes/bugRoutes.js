import express from 'express';
import { createBugReport, getBugReports } from '../controllers/bugController.js';
import { protect, authorize } from '../middleware/auth.js';
import { csrfGuard } from '../middleware/csrf.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.createElement ? express.Router() : express.Router(); // robust map
const limitBugs = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many bug reports' });

router.route('/')
    .post(protect, csrfGuard, limitBugs, createBugReport)
    .get(protect, authorize('admin'), getBugReports);

export default router;
