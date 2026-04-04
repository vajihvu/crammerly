import BugReport from '../models/BugReport.js';
import { logger } from '../utils/logger.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

/**
 * @desc    Submit a new bug report
 * @route   POST /api/v1/bugs
 * @access  Private
 */
export const createBugReport = async (req, res, next) => {
    try {
        const { type, title, description, image } = req.body;

        if (!type || !title || !description) {
           return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const bugReport = await BugReport.create({
            user: req.user._id,
            type,
            title,
            description,
            image: image || ''
        });

        await logAuditEvent({
            req,
            user: req.user._id,
            event: 'BUG_REPORT_CREATED',
            status: 'SUCCESS',
            metadata: { bugId: bugReport._id, type }
        });

        res.status(201).json({
            success: true,
            data: bugReport,
            message: 'Bug report submitted successfully'
        });
    } catch (error) {
        logger.error(`Error creating bug report: ${error.message}`);
        next(error);
    }
};

/**
 * @desc    Get all bug reports (Admin only)
 * @route   GET /api/v1/bugs
 * @access  Private/Admin
 */
export const getBugReports = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        const total = await BugReport.countDocuments();
        
        const bugs = await BugReport.find()
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: bugs.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: bugs
        });
    } catch (error) {
        logger.error(`Error fetching bug reports: ${error.message}`);
        next(error);
    }
};
