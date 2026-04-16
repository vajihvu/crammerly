import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: [10000000, 'Message content is too large']
    },
    type: {
        type: String,
        enum: ['text', 'file', 'image', 'gif', 'sticker', 'voice'],
        default: 'text'
    },
    file_data: {
        url: { type: String, maxlength: 5000000 },
        name: { type: String, maxlength: 255 },
        mimeType: { type: String, maxlength: 100 },
        size: { type: Number, max: 25 * 1024 * 1024 }  // 25MB cap
    },
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Auto-delete messages older than 90 days
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
messageSchema.index({ roomId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

