import StudySession from '../models/StudySession.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Start a new study session
 * @route   POST /api/v1/study-sessions/start
 * @access  Private
 */
export const startSession = asyncHandler(async (req, res) => {
    const { roomId, task } = req.body;
    const userId = req.user._id;

    // 0. Policy: Prevent multiple active sessions (Race condition prevention)
    const existingActive = await StudySession.findOne({ userId, endTime: { $exists: false } });
    if (existingActive) {
        existingActive.endTime = new Date();
        await existingActive.save();
    }

    const session = await StudySession.create({
        userId,
        roomId,
        taskCompleted: task,
        startTime: new Date()
    });


    return res.sendSuccess(session, 201);
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

    return res.sendSuccess(session);
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

    return res.sendSuccess(sessions);
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

    return res.sendSuccess(stats[0] || { totalMinutes: 0, sessionCount: 0 });
});

