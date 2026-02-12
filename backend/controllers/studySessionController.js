import StudySession from '../models/StudySession.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Start a new study session
 * @route   POST /api/v1/study-sessions/start
 * @access  Private
 */
export const startSession = asyncHandler(async (req, res) => {
    const { roomId, task } = req.body;

    const session = await StudySession.create({
        userId: req.user._id,
        roomId,
        taskCompleted: task,
        startTime: new Date()
    });

    res.status(201).json({
        success: true,
        data: session
    });
});

/**
 * @desc    End a study session
 * @route   PUT /api/v1/study-sessions/:id/end
 * @access  Private
 */
export const endSession = asyncHandler(async (req, res) => {
    const session = await StudySession.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!session) {
        res.status(404);
        throw new Error('Session not found');
    }

    session.endTime = new Date();
    await session.save();

    res.json({
        success: true,
        data: session
    });
});

/**
 * @desc    Get all study sessions for user
 * @route   GET /api/v1/study-sessions
 * @access  Private
 */
export const getSessions = asyncHandler(async (req, res) => {
    const sessions = await StudySession.find({ userId: req.user._id })
        .sort({ startTime: -1 })
        .limit(50);

    res.json({
        success: true,
        data: sessions
    });
});

/**
 * @desc    Get aggregated study stats
 * @route   GET /api/v1/study-sessions/stats
 * @access  Private
 */
export const getStats = asyncHandler(async (req, res) => {
    const stats = await StudySession.aggregate([
        { $match: { userId: req.user._id, endTime: { $exists: true } } },
        {
            $group: {
                _id: null,
                totalMinutes: { $sum: "$durationMinutes" },
                sessionCount: { $sum: 1 }
            }
        }
    ]);

    res.json({
        success: true,
        data: stats[0] || { totalMinutes: 0, sessionCount: 0 }
    });
});
