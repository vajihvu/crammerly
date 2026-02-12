import { logAuditEvent } from '../middleware/auditMiddleware.js';

/**
 * Security Notifier Utility
 * In a real production app, this would send actual emails/SMS.
 * For now, it logs critical security events to the audit log and console.
 */

export const notifyNewDeviceLogin = async (req, user, metadata) => {
    console.warn(`[SECURITY] New device login detected for user ${user._id || user}`);
    // Real implementation: sendEmail(user.email, 'New Login Detected', ...)

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_NOTIFY_NEW_DEVICE',
        status: 'SUCCESS',
        metadata: { ...metadata, channel: 'LOG_ONLY' }
    });
};

export const notifyPasswordChange = async (req, user) => {
    console.warn(`[SECURITY] Password changed for user ${user._id || user}`);
    // Real implementation: sendEmail(user.email, 'Your password was changed', ...)

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_NOTIFY_PWD_CHANGE',
        status: 'SUCCESS'
    });
};

export const notifySessionRevoked = async (req, user, reason) => {
    console.warn(`[SECURITY] Session revoked for user ${user._id || user}. Reason: ${reason}`);

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_NOTIFY_SESS_REVOKE',
        status: 'SUCCESS',
        metadata: { reason }
    });
};

export const checkBreachedPassword = async (password) => {
    // Simulated breached password check
    // In production, use HIBP (Have I Been Pwned) API with k-Anonymity
    const commonPasswords = ['password123', 'admin123', 'qwertyuiop', '12345678', 'BreachedPassword123!'];
    if (commonPasswords.includes(password) || commonPasswords.includes(password.toLowerCase())) {
        return { isBreached: true, reason: 'Commonly used password' };
    }
    return { isBreached: false };
};
