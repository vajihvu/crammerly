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
        enum: ['text', 'file', 'gif', 'sticker'],
        default: 'text'
    },
    file_data: {
        type: Object,
        default: null
    }
}, {
    timestamps: true
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
