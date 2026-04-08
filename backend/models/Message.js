import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: [5000, 'Message content cannot exceed 5000 characters']
    },
    type: {
        type: String,
        enum: ['text', 'file', 'gif', 'sticker', 'voice'],
        default: 'text'
    },
    file_data: {
        url: { type: String, maxlength: 2048 },
        name: { type: String, maxlength: 255 },
        mimeType: { type: String, maxlength: 100 },
        size: { type: Number, max: 25 * 1024 * 1024 }  // 25MB cap
    },
    readBy: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Auto-delete messages older than 90 days
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

