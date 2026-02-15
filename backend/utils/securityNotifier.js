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
    if (password.includes('BREACHED')) {
        return { isBreached: true };
    }
    return { isBreached: false };
};

/**
 * PRODUCTION ALERTS (Anomaly Detection)
 */

export const notifyTokenReuse = async (req, user, metadata) => {
    console.error(`[SECURITY ALERT] Token reuse detected for user ${user._id || user}!`);
    // Real implementation: Send to PagerDuty / Slack / Datadog

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_ALERT_TOKEN_REUSE',
        status: 'FAILURE',
        metadata: { ...metadata, severity: 'CRITICAL', alert: 'ANOMALY_DETECTED' }
    });
};

export const notifyRepeatedLockouts = async (req, user, count) => {
    console.error(`[SECURITY ALERT] User ${user._id || user} has been locked out ${count} times! Possible Brute Force.`);

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_ALERT_REPEATED_LOCKOUT',
        status: 'FAILURE',
        metadata: { lockoutCount: count, severity: 'HIGH' }
    });
};

export const notifyLoginSpike = async (req, ip) => {
    console.error(`[SECURITY ALERT] Login rate limit reached for IP: ${ip}. Possible automation/brute-force.`);

    await logAuditEvent({
        req,
        event: 'SEC_ALERT_LOGIN_SPIKE',
        status: 'FAILURE',
        metadata: { ip, severity: 'HIGH', alert: 'BRUTE_FORCE_PROTECTION' }
    });
};

export const notifySuspiciousIpChange = async (req, user, oldIp, newIp) => {
    console.warn(`[SECURITY ALERT] Session IP shift for user ${user._id || user}: ${oldIp} -> ${newIp}`);

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_ALERT_IP_MOVE',
        status: 'FAILURE',
        metadata: { oldIp, newIp, severity: 'MEDIUM' }
    });
};

/**
 * IDENTITY COMM CHANNEL (Email Dispatchers)
 */

export const sendVerificationEmail = async (req, user, token) => {
    console.info(`[IDENTITY] Sending verification email to ${user.email}. Token: ${token}`);
    // Real implementation: Integration with SendGrid / AWS SES / Mailgun

    await logAuditEvent({
        req,
        user: user._id,
        event: 'AUTH_SEND_VERIFY_EMAIL',
        status: 'SUCCESS',
        metadata: { channel: 'LOG_ONLY' }
    });
};

export const sendPasswordResetEmail = async (req, user, token) => {
    console.info(`[IDENTITY] Sending password reset email to ${user.email}. Token: ${token}`);

    await logAuditEvent({
        req,
        user: user._id,
        event: 'AUTH_SEND_RESET_EMAIL',
        status: 'SUCCESS',
        metadata: { channel: 'LOG_ONLY' }
    });
};
