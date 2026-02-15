import Message from '../models/Message.js';
import Room from '../models/Room.js';


/**
 * @desc    Get all messages for a room
 * @route   GET /api/v1/messages/:roomId
 */
export const getMessagesByRoom = async (req, res) => {
    const { roomId } = req.params;

    // Authorization: Check if user is a member of the room
    const room = await Room.findById(roomId);
    if (!room) {
        return res.sendError('Room not found', 404, 'RES_NOT_FOUND');
    }


    const isMember = room.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
        return res.sendError('You must be a member of this room to view messages', 403, 'AUTH_FORBIDDEN');
    }


    const messages = await Message.find({ room_id: roomId })
        .populate('sender_id', 'name tag avatar')
        .sort({ createdAt: 1 });


    const formattedMessages = messages.map(m => ({
        id: m._id,
        sender_id: m.sender_id?._id,
        senderName: m.sender_id?.name || 'Unknown',
        senderTag: m.sender_id?.tag || '0000',
        text: m.content,
        type: m.type,
        fileData: m.file_data,
        timestamp: m.createdAt
    }));

    return res.sendSuccess(formattedMessages);
};


/**
 * @desc    Send a message
 * @route   POST /api/v1/messages/:roomId
 */
export const sendMessage = async (req, res) => {
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
        timestamp: populated.createdAt
    };

    // Broadcast to room
    import('../utils/socket.js').then(({ emitToRoom }) => {
        emitToRoom(req.params.roomId, 'new_message', formatted);
    });

    return res.sendSuccess(formatted, 201);
};

