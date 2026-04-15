import StudySession from '../models/StudySession.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { cacheGet, cacheSet, cacheInvalidate } from '../utils/cache.js';

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


    await cacheInvalidate(`stats:${userId}`);
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
        return res.sendError('Session not found', 404, 'RES_NOT_FOUND');
    }

    session.endTime = new Date();
    await session.save();

    await cacheInvalidate(`stats:${req.user._id}`);
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
    const cacheKey = `stats:${req.user._id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.sendSuccess(cached);

    const stats = await StudySession.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(req.user._id), endTime: { $exists: true } } },
        {
            $group: {
                _id: null,
                totalMinutes: { $sum: "$durationMinutes" },
                sessionCount: { $sum: 1 }
            }
        }
    ]);

    const result = stats[0] || { totalMinutes: 0, sessionCount: 0 };
    await cacheSet(cacheKey, result, 300); // 5-minute TTL
    return res.sendSuccess(result);
});

