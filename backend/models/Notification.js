import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    type: {
        type: String,
        enum: ['FRIEND_REQUEST', 'FRIEND_ACCEPT', 'ROOM_INVITE', 'DEADLINE_REMINDER', 'GENERIC'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId, // ID of the request, room, etc.
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
