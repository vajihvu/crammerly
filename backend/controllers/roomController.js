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
        code: room.code,
        creator_id: room.creator_id?._id,
        scheduleDate: room.schedule_date,
        scheduleTime: room.schedule_time,
        members: room.members.map(m => ({
            id: m.user?._id,
            name: m.user?.name || 'Anonymous',
            progress: m.progress || []
        }))
    }));

    res.json({ success: true, data: formattedRooms });
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

    res.status(201).json({ success: true, data: room });
};

/**
 * @desc    Join a room
 * @route   POST /api/v1/rooms/:id/join
 */
export const joinRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
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

    res.json({ success: true, message: 'Joined successfully' });
};

/**
 * @desc    Get room by code
 * @route   GET /api/v1/rooms/code/:code
 */
export const getRoomByCode = async (req, res) => {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() });
    if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room });
};

/**
 * @desc    Delete room
 * @route   DELETE /api/v1/rooms/:id
 */
export const deleteRoom = async (req, res) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.creator_id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await room.deleteOne();
    res.json({ success: true, message: 'Room deleted' });
};

/**
 * @desc    Update progress in room
 * @route   PUT /api/v1/rooms/:id/progress
 */
export const updateProgress = async (req, res) => {
    const { task } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const memberIndex = room.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIndex === -1) {
        return res.status(403).json({ success: false, message: 'Not a member of this room' });
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

    res.json({ success: true, data: room.members[memberIndex].progress });
};
