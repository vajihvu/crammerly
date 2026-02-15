import Room from '../models/Room.js';

/**
 * @desc    Get all rooms
 * @route   GET /api/v1/rooms
 */
export const getAllRooms = async (req, res) => {
    const rooms = await Room.find()
        .populate('creator_id', 'name avatar')
        .populate('members.user', 'name avatar')
        .sort({ createdAt: -1 });

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
            progress: m.progress || []
        }))
    }));

    return res.sendSuccess(formattedRooms);
};


/**
 * @desc    Create a room
 * @route   POST /api/v1/rooms
 */
export const createRoom = async (req, res) => {
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

    return res.sendSuccess(room, 201);
};


/**
 * @desc    Join a room
 * @route   POST /api/v1/rooms/:id/join
 */
export const joinRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }


    // Authorization: Private rooms require the correct code
    if (room.privacy === 'Private') {
        const { code } = req.body;
        if (!code || code.toUpperCase() !== room.code) {
            return res.sendError('Invalid or missing code for this private room', 403, 'AUTH_FORBIDDEN');
        }
    }



    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
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
};

/**
 * @desc    Get room by code
 * @route   GET /api/v1/rooms/code/:code
 */
export const getRoomByCode = async (req, res) => {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }
    return res.sendSuccess(room);
};


/**
 * @desc    Delete room
 * @route   DELETE /api/v1/rooms/:id
 */
export const deleteRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    if (room.creator_id.toString() !== req.user._id.toString()) {
        return res.sendError('Not authorized', 403, 'AUTH_FORBIDDEN');
    }


    await room.deleteOne();
    return res.sendSuccess(null, 200, 'Room deleted');
};


/**
 * @desc    Update progress in room
 * @route   PUT /api/v1/rooms/:id/progress
 */
export const updateProgress = async (req, res) => {
    const { task } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    const memberIndex = room.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
        return res.sendError('Not a member of this room', 403, 'AUTH_FORBIDDEN');
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
};

