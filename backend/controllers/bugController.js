import BugReport from '../models/BugReport.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Submit a new bug report
 * @route   POST /api/v1/bugs
 * @access  Private
 */
export const createBugReport = asyncHandler(async (req, res) => {
    const { type, title, description, image } = req.body;

    if (!type || !title || !description) {
        return res.sendError('Please provide all required fields', 400);
    }

    const bugReport = await BugReport.create({
        user: req.user._id,
        type,
        title,
        description,
        image: image || ''
    });

    return res.sendSuccess(bugReport, 201, 'Bug report submitted successfully');
});

/**
 * @desc    Get all bug reports (Admin only)
 * @route   GET /api/v1/bugs
 * @access  Private/Admin
 */
export const getBugReports = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const total = await BugReport.countDocuments();

    const bugs = await BugReport.find()
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit);

    return res.sendSuccess(bugs, 200, undefined, {
        total,
        page,
        pages: Math.ceil(total / limit)
    });
});
