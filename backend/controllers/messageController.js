import Message from '../models/Message.js';

/**
 * @desc    Get all messages for a room
 * @route   GET /api/v1/messages/:roomId
 */
export const getMessagesByRoom = async (req, res) => {
    const messages = await Message.find({ room_id: req.params.roomId })
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

    res.json({ success: true, data: formattedMessages });
};

/**
 * @desc    Send a message
 * @route   POST /api/v1/messages/:roomId
 */
export const sendMessage = async (req, res) => {
    const { content, type, fileData } = req.body;

    const message = await Message.create({
        room_id: req.params.roomId,
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

    res.status(201).json({ success: true, data: formatted });
};
