import TaskCard from '../models/TaskCard.js';
import Notification from '../models/Notification.js';
import Room from '../models/Room.js';
import { emitToUser } from '../utils/socket.js';

/**
 * Deadline Reminder Worker
 * Runs every hour, finds tasks with due dates within 24 hours that haven't had reminders sent yet.
 * Creates in-app notifications for assigned members.
 */
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function checkDeadlines() {
    try {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Find tasks due within 24 hours that haven't had reminders
        const upcomingTasks = await TaskCard.find({
            dueDate: { $gte: now, $lte: in24Hours },
            reminderSent: false,
            assignee: { $ne: null }
        }).populate('assignee', 'name');

        for (const task of upcomingTasks) {
            try {
                const room = await Room.findById(task.roomId).select('name');
                if (!room) continue;

                const hoursLeft = Math.round((task.dueDate - now) / (1000 * 60 * 60));

                const notification = await Notification.create({
                    to: task.assignee._id,
                    type: 'DEADLINE_REMINDER',
                    content: `⏰ "${task.title}" in ${room.name} is due in ${hoursLeft}h`,
                    relatedId: task.roomId
                });

                emitToUser(task.assignee._id.toString(), 'new_notification', {
                    id: notification._id,
                    type: 'DEADLINE_REMINDER',
                    content: notification.content,
                    timestamp: notification.createdAt,
                    relatedId: task.roomId
                });

                task.reminderSent = true;
                await task.save();
            } catch (err) {
                console.error(`[DeadlineWorker] Error processing task ${task._id}:`, err.message);
            }
        }

        if (upcomingTasks.length > 0) {
            console.log(`[DeadlineWorker] Sent ${upcomingTasks.length} deadline reminders`);
        }
    } catch (err) {
        console.error('[DeadlineWorker] Error:', err.message);
    }
}

let intervalId = null;

export function startDeadlineWorker() {
    console.log('[DeadlineWorker] Starting deadline reminder worker (interval: 1h)');
    // Run once immediately, then on interval
    checkDeadlines();
    intervalId = setInterval(checkDeadlines, INTERVAL_MS);
}

export function stopDeadlineWorker() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[DeadlineWorker] Stopped');
    }
}
