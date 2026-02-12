import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        index: true
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    durationMinutes: {
        type: Number,
        default: 0
    },
    taskCompleted: {
        type: String
    }
}, {
    timestamps: true
});

// Calculate duration on end
studySessionSchema.pre('save', async function () {
    if (this.endTime && this.startTime) {
        const diffMs = this.endTime - this.startTime;
        this.durationMinutes = Math.round(diffMs / 60000);
    }
});

const StudySession = mongoose.model('StudySession', studySessionSchema);
export default StudySession;
