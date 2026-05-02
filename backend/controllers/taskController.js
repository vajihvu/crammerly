import TaskCard from '../models/TaskCard.js';
import Room from '../models/Room.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get all tasks for a room (grouped by status)
 * @route   GET /api/v1/rooms/:id/tasks
 */
export const getTasks = asyncHandler(async (req, res) => {
    const roomId = req.params.id;

    // Verify membership
    const room = await Room.findById(roomId).select('members').lean();
    if (!room) return res.sendError('Room not found', 404, 'RES_NOT_FOUND');

    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');

    const tasks = await TaskCard.find({ roomId })
        .populate('assignee', 'name avatar')
        .populate('createdBy', 'name avatar')
        .sort({ order: 1, createdAt: -1 })
        .lean();

    const grouped = {
        todo: tasks.filter(t => t.status === 'todo'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        done: tasks.filter(t => t.status === 'done')
    };

    return res.sendSuccess(grouped);
});

/**
 * @desc    Create a task card
 * @route   POST /api/v1/rooms/:id/tasks
 */
export const createTask = asyncHandler(async (req, res) => {
    const roomId = req.params.id;
    const { title, description, role, assignee, dueDate, status } = req.body;

    const room = await Room.findById(roomId).select('members').lean();
    if (!room) return res.sendError('Room not found', 404, 'RES_NOT_FOUND');

    // Only members can create tasks
    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');

    // Get highest order in this status column
    const maxOrderTask = await TaskCard.findOne({ roomId, status: status || 'todo' }).sort({ order: -1 });
    const nextOrder = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await TaskCard.create({
        roomId,
        title,
        description: description || '',
        role: role || '',
        assignee: assignee || null,
        createdBy: req.user._id,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'todo',
        order: nextOrder
    });

    const populated = await TaskCard.findById(task._id)
        .populate('assignee', 'name avatar')
        .populate('createdBy', 'name avatar')
        .lean();

    // Emit socket event for real-time update
    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(roomId, 'task_created', populated);
    });

    return res.sendSuccess(populated, 201);
});

/**
 * @desc    Update a task card
 * @route   PUT /api/v1/rooms/:id/tasks/:taskId
 */
export const updateTask = asyncHandler(async (req, res) => {
    const { id: roomId, taskId } = req.params;
    const updates = req.body;

    const task = await TaskCard.findOne({ _id: taskId, roomId });
    if (!task) return res.sendError('Task not found', 404, 'RES_NOT_FOUND');

    // Verify membership
    const room = await Room.findById(roomId).select('members').lean();
    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');

    // Apply updates
    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.role !== undefined) task.role = updates.role;
    if (updates.status !== undefined) task.status = updates.status;
    if (updates.order !== undefined) task.order = updates.order;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.assignee !== undefined) task.assignee = updates.assignee || null;

    // Reset reminder if due date changed
    if (updates.dueDate !== undefined) task.reminderSent = false;

    await task.save();

    const populated = await TaskCard.findById(task._id)
        .populate('assignee', 'name avatar')
        .populate('createdBy', 'name avatar');

    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(roomId, 'task_updated', populated);
    });

    return res.sendSuccess(populated);
});

/**
 * @desc    Delete a task card
 * @route   DELETE /api/v1/rooms/:id/tasks/:taskId
 */
export const deleteTask = asyncHandler(async (req, res) => {
    const { id: roomId, taskId } = req.params;

    const task = await TaskCard.findOne({ _id: taskId, roomId });
    if (!task) return res.sendError('Task not found', 404, 'RES_NOT_FOUND');

    // Only creator, task creator, or admin can delete
    const room = await Room.findById(roomId);
    const isOwner = room.creatorId.toString() === req.user._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user._id.toString();
    const member = room.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = member?.isAdmin;

    if (!isOwner && !isTaskCreator && !isAdmin) {
        return res.sendError('Not authorized to delete this task', 403, 'AUTH_FORBIDDEN');
    }

    await task.deleteOne();

    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(roomId, 'task_deleted', { taskId });
    });

    return res.sendSuccess(null, 200, 'Task deleted');
});

/**
 * @desc    Claim / self-assign a task
 * @route   PUT /api/v1/rooms/:id/tasks/:taskId/claim
 */
export const claimTask = asyncHandler(async (req, res) => {
    const { id: roomId, taskId } = req.params;

    const task = await TaskCard.findOne({ _id: taskId, roomId });
    if (!task) return res.sendError('Task not found', 404, 'RES_NOT_FOUND');

    const room = await Room.findById(roomId);
    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');

    // Toggle: if already assigned to this user, unclaim; otherwise claim
    if (task.assignee && task.assignee.toString() === req.user._id.toString()) {
        task.assignee = null;
    } else {
        task.assignee = req.user._id;
    }

    await task.save();

    const populated = await TaskCard.findById(task._id)
        .populate('assignee', 'name avatar')
        .populate('createdBy', 'name avatar');

    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(roomId, 'task_updated', populated);
    });

    return res.sendSuccess(populated);
});

/**
 * @desc    Assign a project role to a member
 * @route   PUT /api/v1/rooms/:id/members/:memberId/role
 */
export const assignRole = asyncHandler(async (req, res) => {
    const { id: roomId, memberId } = req.params;
    const { role } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.sendError('Room not found', 404, 'RES_NOT_FOUND');

    // Only owner or admins can assign roles
    const isOwner = room.creatorId.toString() === req.user._id.toString();
    const callerMember = room.members.find(m => m.user.toString() === req.user._id.toString());
    if (!isOwner && !callerMember?.isAdmin) {
        return res.sendError('Only owner or admins can assign roles', 403, 'AUTH_FORBIDDEN');
    }

    const memberIndex = room.members.findIndex(m => m.user.toString() === memberId);
    if (memberIndex === -1) {
        return res.sendError('User is not a member of this room', 404, 'RES_NOT_FOUND');
    }

    room.members[memberIndex].role = role;
    await room.save();

    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(roomId, 'member_role_updated', {
            memberId,
            role
        });
    });

    return res.sendSuccess({ memberId, role });
});
