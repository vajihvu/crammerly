import Notification from '../models/Notification.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all notifications for current user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(20);

    return res.sendSuccess(notifications);
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
        return res.sendError('Notification not found', 404, 'RES_NOT_FOUND');
    }

    notification.isRead = true;
    await notification.save();

    return res.sendSuccess(notification);
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
