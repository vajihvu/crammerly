import Message from '../models/Message.js';
import Room from '../models/Room.js';
import asyncHandler from '../utils/asyncHandler.js';


/**
 * @desc    Get all messages for a room
 * @route   GET /api/v1/messages/:roomId
 */
export const getMessagesByRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const cursor = req.query.cursor;

    // Authorization: Check if user is a member of the room
    const room = await Room.findById(roomId);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }


    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
        return res.sendError('You must be a member of this room to view messages', 403, 'AUTH_FORBIDDEN');
    }

    const query = { room_id: roomId };
    if (cursor) {
        const cursorDate = new Date(cursor);
        if (isNaN(cursorDate.getTime())) {
            return res.sendError('Invalid cursor value', 400, 'VAL_INVALID_CURSOR');
        }
        query.createdAt = { $lt: cursorDate };
    }

    const messages = await Message.find(query)
        .populate('sender_id', 'name tag avatar')
        .sort({ createdAt: -1 })
        .limit(limit);

    // Reverse to chronological order for display
    messages.reverse();

    const formattedMessages = messages.map(m => ({
        id: m._id,
        sender_id: m.sender_id?._id,
        senderName: m.sender_id?.name || 'Unknown',
        senderTag: m.sender_id?.tag || '0000',
        text: m.content,
        type: m.type,
        fileData: m.file_data,
        isRead: m.sender_id?._id?.toString() === req.user._id.toString() ? (m.readBy?.length > 0) : true,
        timestamp: m.createdAt
    }));

    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[0].createdAt : null;

    return res.sendSuccess({
        messages: formattedMessages,
        nextCursor,
        hasMore
    });
});


/**
 * @desc    Send a message
 * @route   POST /api/v1/messages/:roomId
 */
export const sendMessage = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { content, type, fileData } = req.body;

    // Authorization: Check if user is a member of the room
    const room = await Room.findById(roomId);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }


    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
        return res.sendError('You must be a member of this room to send messages', 403, 'AUTH_FORBIDDEN');
    }


    const message = await Message.create({
        room_id: roomId,
        sender_id: req.user._id,
        content,
        type: type || 'text',
        file_data: fileData
    });

    const populated = await message.populate('sender_id', 'name tag avatar');

    const formatted = {
        id: populated._id,
        sender_id: populated.sender_id._id,
        senderName: populated.sender_id.name,
        senderTag: populated.sender_id.tag,
        text: populated.content,
        type: populated.type,
        fileData: populated.file_data,
        room_id: roomId,
        isRead: false,
        timestamp: populated.createdAt
    };

    // Broadcast to room
    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(req.params.roomId, 'new_message', formatted);
    });

    return res.sendSuccess(formatted, 201);
});


/**
 * @desc    Mark all messages in a room as read for the current user
 * @route   PATCH /api/v1/messages/:roomId/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Authorization check (same as other message routes)
    const room = await Room.findById(roomId);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }

    const isMember = room.members.some(m => m.user.toString() === userId.toString());
    if (!isMember) {
        return res.sendError('Access denied', 403, 'AUTH_FORBIDDEN');
    }

    // Update all messages in this room that weren't sent by the user and haven't been read by them yet
    const result = await Message.updateMany(
        {
            room_id: roomId,
            sender_id: { $ne: userId },
            'readBy.user_id': { $ne: userId }
        },
        {
            $push: { readBy: { user_id: userId, readAt: new Date() } }
        }
    );

    // Broadcast read event if any messages were updated
    if (result.modifiedCount > 0) {
        import('../utils/socket.js').then(({ emitToRoom }) => {
            emitToRoom(roomId, 'messages_read', {
                room_id: roomId,
                reader_id: userId,
                readAt: new Date()
            });
        });
    }

    return res.sendSuccess({ modifiedCount: result.modifiedCount });
});

