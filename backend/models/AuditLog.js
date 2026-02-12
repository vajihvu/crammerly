import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    event: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        required: true
    },
    ipAddress: String,
    userAgent: String,
    requestId: {
        type: String,
        index: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '90d' // Automatically clean up logs after 90 days
    }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
