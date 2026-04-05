import Room from '../models/Room.js';
import asyncHandler from '../utils/asyncHandler.js';
import { cacheGet, cacheSet } from '../utils/cache.js';

/**
 * @desc    Get all rooms
 * @route   GET /api/v1/rooms
 */
export const getAllRooms = asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor = req.query.cursor;

    // Cache key encodes pagination params — each page cached independently
    const cacheKey = `rooms:list:${req.user._id}:${limit}:${cursor || 'first'}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.sendSuccess(cached);

    const query = {
        $or: [
            { privacy: 'Public' },
            { 'members.user': req.user._id }
        ]
    };
    if (cursor) {
        const cursorDate = new Date(cursor);
        if (isNaN(cursorDate.getTime())) {
            return res.sendError('Invalid cursor value', 400, 'VAL_INVALID_CURSOR');
        }
        query.createdAt = { $lt: cursorDate };
    }

    const rooms = await Room.find(query)
        .populate('creator_id', 'name avatar')
        .populate('members.user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(limit);

    const formattedRooms = rooms.map(room => ({
        id: room._id,
        name: room.name,
        task: room.task,
        topic: room.topic,
        privacy: room.privacy,
        code: (room.privacy === 'Public' || room.creator_id?.toString() === req.user._id.toString() || room.members.some(m => m.user?._id?.toString() === req.user._id.toString())) ? room.code : undefined,
        creator_id: room.creator_id?._id,
        scheduleDate: room.schedule_date,
        scheduleTime: room.schedule_time,
        members: room.members.map(m => ({
            id: m.user?._id,
            name: m.user?.name || 'Anonymous',
            isAdmin: m.isAdmin || false,
            progress: m.progress || []
        }))
    }));

    const hasMore = rooms.length === limit;
    const nextCursor = hasMore ? rooms[rooms.length - 1].createdAt : null;
    const payload = { rooms: formattedRooms, nextCursor, hasMore };

    await cacheSet(cacheKey, payload, 30); // 30-second TTL
    return res.sendSuccess(payload);
});


/**
 * @desc    Create a room
 * @route   POST /api/v1/rooms
 */
export const createRoom = asyncHandler(async (req, res) => {
    const { name, task, topic, privacy, scheduleDate, scheduleTime } = req.body;

    const room = await Room.create({
        name,
        task,
        topic,
        privacy,
        schedule_date: scheduleDate,
        schedule_time: scheduleTime,
        creator_id: req.user._id,
        members: [{ user: req.user._id, progress: [] }]
    });

    const formattedRoom = {
        id: room._id,
        name: room.name,
        task: room.task,
        topic: room.topic,
        privacy: room.privacy,
        code: room.code,
        creator_id: room.creator_id,
        scheduleDate: room.schedule_date,
        scheduleTime: room.schedule_time,
        members: room.members.map(m => ({
            id: m.user,
            name: req.user.name || 'Anonymous', // Current user's name
            progress: m.progress || []
        }))
    };

    return res.sendSuccess(formattedRoom, 201);
});


/**
 * @desc    Join a room
 * @route   POST /api/v1/rooms/:id/join
 */
export const joinRoom = asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }


    const isCreator = room.creator_id && room.creator_id.toString() === req.user._id.toString();

    // Authorization: Private rooms require the correct code
    if (room.privacy === 'Private' && !isCreator) {
        const { code } = req.body;
        if (!code || code.toUpperCase() !== room.code) {
            return res.sendError('Invalid or missing code for this private room', 403, 'AUTH_FORBIDDEN');
        }
    }



    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
        // Enforce max member limit
        const maxMembers = room.maxMembers || 50;
        if (room.members.length >= maxMembers) {
            return res.sendError(`Room is full (max ${maxMembers} members)`, 400, 'ROOM_FULL');
        }
        room.members.push({ user: req.user._id, progress: [] });
        await room.save();

        // Notify others
        import('../utils/socket.js').then(({ emitToRoom }) => {
            emitToRoom(req.params.id, 'member_joined', {
                id: req.user._id,
                name: req.user.name
            });
        });
    }
    return res.sendSuccess(null, 200, 'Joined successfully');
});

/**
 * @desc    Get room by code
 * @route   GET /api/v1/rooms/code/:code
 */
export const getRoomByCode = asyncHandler(async (req, res) => {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
        .populate('members.user', 'name avatar');
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    // Only return sensitive data (code, full members) if the requester is a member
    const isMember = room.members.some(m => m.user?._id?.toString() === req.user._id.toString());
    if (isMember) {
        return res.sendSuccess(room);
    }

    // Non-members get only safe fields
    return res.sendSuccess({
        id: room._id,
        name: room.name,
        topic: room.topic,
        privacy: room.privacy,
        memberCount: room.members.length
    });
});


/**
 * @desc    Delete room
 * @route   DELETE /api/v1/rooms/:id
 */
export const deleteRoom = asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    if (room.creator_id.toString() !== req.user._id.toString()) {
        return res.sendError('Not authorized', 403, 'AUTH_FORBIDDEN');
    }

    // Notify all connected members BEFORE deleting
    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(req.params.id, 'room_deleted', {
            roomId: room._id,
            roomName: room.name,
            deletedBy: req.user.name
        });
    });

    // Cascade: delete all messages in this room
    const { default: Message } = await import('../models/Message.js');
    await Message.deleteMany({ room_id: room._id });

    await room.deleteOne();
    return res.sendSuccess(null, 200, 'Room deleted');
});


/**
 * @desc    Leave a room (non-owner)
 * @route   POST /api/v1/rooms/:id/leave
 */
export const leaveRoom = asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    // Owner cannot leave — they must delete instead
    if (room.creator_id.toString() === req.user._id.toString()) {
        return res.sendError('Room owner cannot leave. Delete the room instead.', 400, 'ROOM_OWNER_LEAVE');
    }

    const memberIndex = room.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
        return res.sendError('You are not a member of this room', 400, 'NOT_MEMBER');
    }

    room.members.splice(memberIndex, 1);
    await room.save();

    // Notify remaining members
    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(req.params.id, 'member_left', {
            id: req.user._id,
            name: req.user.name
        });
    });

    return res.sendSuccess(null, 200, 'Left room successfully');
});


/**
 * @desc    Update progress in room
 * @route   PUT /api/v1/rooms/:id/progress
 */
export const updateProgress = asyncHandler(async (req, res) => {
    const { task } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    const memberIndex = room.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
        return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');
    }


    // Cap progress array to prevent unbounded growth (MongoDB 16MB doc limit risk)
    const MAX_PROGRESS = 200;
    if (room.members[memberIndex].progress.length >= MAX_PROGRESS) {
        room.members[memberIndex].progress.shift(); // drop oldest
    }
    room.members[memberIndex].progress.push({ task, time: new Date() });
    await room.save();

    // Notify others
    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(req.params.id, 'progress_updated', {
            userId: req.user._id,
            progress: room.members[memberIndex].progress
        });
    });

    return res.sendSuccess(room.members[memberIndex].progress);
});

/**
 * @desc    Toggle admin status for a room member
 * @route   PUT /api/v1/rooms/:id/members/:memberId/admin
 */
export const toggleRoomAdmin = asyncHandler(async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    // Only room creator can assign admins
    if (room.creator_id.toString() !== req.user._id.toString()) {
        return res.sendError('Only the room owner can assign admins', 403, 'AUTH_FORBIDDEN');
    }

    const memberIndex = room.members.findIndex(m => m.user.toString() === req.params.memberId);
    if (memberIndex === -1) {
        return res.sendError('User is not a member of this room', 404, 'RES_NOT_FOUND');
    }

    if (room.members[memberIndex].user.toString() === room.creator_id.toString()) {
        return res.sendError('Room owner always has owner privileges', 400, 'VAL_INVALID_INPUT');
    }

    // Toggle
    room.members[memberIndex].isAdmin = !room.members[memberIndex].isAdmin;
    await room.save();

    // Socket Notification for real-time update
    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(req.params.id, 'member_updated', {
            id: room.members[memberIndex].user,
            isAdmin: room.members[memberIndex].isAdmin
        });
    });

    return res.sendSuccess({ memberId: room.members[memberIndex].user, isAdmin: room.members[memberIndex].isAdmin });
});

