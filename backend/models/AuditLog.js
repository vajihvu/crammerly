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
        immutable: true,
        expires: '365d' // Increased retention for production compliance
    }
});

// HARDENING: Prevent any updates to audit logs (Immutability)
auditLogSchema.pre('save', async function () {
    if (!this.isNew) {
        throw new Error('CRITICAL: Audit logs are immutable and cannot be modified.');
    }
});

// Prevent deletions via middleware if possible (soft protection)
auditLogSchema.pre('remove', async function () {
    throw new Error('CRITICAL: Audit logs cannot be deleted.');
});

// COMPOUND INDEX: For fast security forensics
auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
