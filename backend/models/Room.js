import mongoose from 'mongoose';

const roomMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    progress: [{
        task: String,
        time: { type: Date, default: Date.now }
    }]
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
    creator_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [roomMemberSchema],
    schedule_date: {
        type: String
    },
    schedule_time: {
        type: String
    }
}, {
    timestamps: true
});

// Generate code for private rooms
roomSchema.pre('save', async function () {
    if (this.privacy === 'Private' && !this.code) {
        this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
