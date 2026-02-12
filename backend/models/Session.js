import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    refreshTokenHash: {
        type: String,
        required: true,
        index: true
    },
    previousTokenHashes: {
        type: [String],
        default: []
    },
    userAgent: {
        type: String,
        default: 'Unknown'
    },
    deviceName: {
        type: String,
        default: 'Unknown Device'
    },
    ipAddress: {
        type: String
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    },
    revokedAt: {
        type: Date
    },
    isValid: {
        type: Boolean,
        default: true
    },
    refreshCount: {
        type: Number,
        default: 0
    },
    isSuspicious: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Auto-delete expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
