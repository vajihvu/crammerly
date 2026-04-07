import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate('sender', 'name username avatar_url tag')
        .sort({ createdAt: -1 })
        .limit(50);

    return res.sendSuccess(notifications);
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
export const markRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
        return res.sendError('Notification not found', 404, 'RES_NOT_FOUND');
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
        return res.sendError('Unauthorized', 403, 'AUTH_FORBIDDEN');
    }

    notification.isRead = true;
    await notification.save();

    return res.sendSuccess({ message: 'Notification marked as read' });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Private
 */
export const markAllRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );

    return res.sendSuccess({ message: 'All notifications marked as read' });
});
