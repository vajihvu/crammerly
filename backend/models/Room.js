import mongoose from 'mongoose';
import crypto from 'crypto';

const roomMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    progress: [{
        task: String,
        time: { type: Date, default: Date.now }
    }],
    isAdmin: { type: Boolean, default: false }
}, { _id: false });

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        maxlength: [100, 'Room name cannot exceed 100 characters']
    },
    task: {
        type: String,
        trim: true,
        maxlength: [200, 'Task description cannot exceed 200 characters']
    },
    topic: {
        type: String,
        default: 'General'
    },
    privacy: {
        type: String,
        enum: ['Public', 'Private'],
        default: 'Public'
    },
    code: {
        type: String,
        uppercase: true,
        index: { unique: true, sparse: true }
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [roomMemberSchema],
    scheduleDate: {
        type: String
    },
    scheduleTime: {
        type: String
    },
    maxMembers: {
        type: Number,
        default: 80,
        min: 2,
        max: 200
    },
    roomType: {
        type: String,
        enum: ['Study', 'DM'],
        default: 'Study'
    },
    isDM: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Generate code for private rooms
roomSchema.pre('save', async function () {
    if (this.privacy === 'Private' && !this.code) {
        // High entropy 6-character secure code
        this.code = crypto.randomBytes(3).toString('hex').toUpperCase();
    }
});

// Indexes for high-performance scalable queries
roomSchema.index({ topic: 1, privacy: 1, createdAt: -1 });
roomSchema.index({ 'members.user': 1 }); // For User's Rooms dashboard queries

const Room = mongoose.model('Room', roomSchema);
export default Room;
