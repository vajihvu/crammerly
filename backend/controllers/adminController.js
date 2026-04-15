import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

/**
 * Get all users (Paginated)
 */
export const getUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
        query.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
            { username: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password +tokenVersion')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res.sendSuccess(users, 200, undefined, {
        page,
        pages: Math.ceil(total / limit),
        total
    });
});

/**
 * Toggle User Status (Ban/Unban)
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Prevent admin from banning themselves
    if (user._id.toString() === req.user._id.toString()) {
        const error = new Error('You cannot ban your own administrative account');
        error.statusCode = 400;
        throw error;
    }

    user.isActive = isActive;
    // If banning, increment tokenVersion to kick them out immediately
    if (!isActive) {
        user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    logger.info(`Moderation: Admin ${req.user.email} ${isActive ? 'reactivated' : 'deactivated'} user ${user.email}`);

    return res.sendSuccess(user, 200, `User ${isActive ? 'reactivated' : 'deactivated'} successfully`);
});

/**
 * Update User Role (Promote/Demote)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.findById(id);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString()) {
        const error = new Error('You cannot demote your own administrative account');
        error.statusCode = 400;
        throw error;
    }

    user.role = role;
    // Increment tokenVersion to force token refresh with new role
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    logger.info(`Moderation: Admin ${req.user.email} updated role of ${user.email} to ${role}`);

    return res.sendSuccess(user, 200, `User role updated to ${role} successfully`);
});
