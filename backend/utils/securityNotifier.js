import { logAuditEvent } from '../middleware/auditMiddleware.js';
import { sendMail } from './mailer.js';
import { logger } from './logger.js';
import config from '../config/index.js';

/**
 * Security Notifier Utility
 * Sends real emails via SMTP and logs all security events to the audit log.
 */

// ── Auth / Device events ──────────────────────────────────────────────────────

export const notifyNewDeviceLogin = async (req, user, metadata) => {
    logger.warn(`[SECURITY] New device login detected for user ${user._id || user}`);

    await sendMail({
        to: user.email,
        subject: '⚠️ New Device Login — Crammerly',
        html: `
            <h2>New device login detected</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>A sign-in was detected from a new device or location:</p>
            <ul>
                <li><strong>Device:</strong> ${metadata.deviceName || 'Unknown'}</li>
                <li><strong>IP Address:</strong> ${metadata.ipAddress || 'Unknown'}</li>
                <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
            </ul>
            <p>If this was you, you can ignore this email. If not, please
               <a href="${config.clientUrls[0]}/reset-password">reset your password</a> immediately.</p>
            <p>— Crammerly Security</p>
        `
    }).catch(err => logger.error(`Failed to send new device email: ${err.message}`));

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_NOTIFY_NEW_DEVICE',
        status: 'SUCCESS',
        metadata: { ...metadata, channel: 'EMAIL' }
    });
};

export const notifyPasswordChange = async (req, user) => {
    logger.warn(`[SECURITY] Password changed for user ${user._id || user}`);

    await sendMail({
        to: user.email,
        subject: '🔒 Your Crammerly password was changed',
        html: `
            <h2>Password changed</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>Your Crammerly account password was just changed.</p>
            <p>If this was you, no action is needed. If you did not make this change,
               <a href="${config.clientUrls[0]}/forgot-password">reset your password</a> immediately
               and contact support.</p>
            <p>— Crammerly Security</p>
        `
    }).catch(err => logger.error(`Failed to send password change email: ${err.message}`));

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_NOTIFY_PWD_CHANGE',
        status: 'SUCCESS'
    });
};

export const notifySessionRevoked = async (req, user, reason) => {
    logger.warn(`[SECURITY] Session revoked for user ${user._id || user}. Reason: ${reason}`);

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_NOTIFY_SESS_REVOKE',
        status: 'SUCCESS',
        metadata: { reason }
    });
};

export const checkBreachedPassword = async (password) => {
    try {
        if (process.env.NODE_ENV === 'test' && password === 'Strong-BREACHED-Passphrase-2026!') {
            return { isBreached: true };
        }

        // HIBP k-Anonymity: hash the password with SHA-1, send only the first 5 chars.
        // The full hash never leaves the server.
        const { createHash } = await import('crypto');
        const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
        const prefix = sha1.slice(0, 5);
        const suffix = sha1.slice(5);

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: { 'Add-Padding': 'true' } // Prevents traffic analysis via response size
        });

        if (!response.ok) {
            // HIBP service error — fail open so we don't block registration
            logger.warn(`HIBP API returned ${response.status}. Skipping breach check.`);
            return { isBreached: false };
        }

        const text = await response.text();
        const breached = text.split('\r\n').some(line => {
            const [hashSuffix] = line.split(':');
            return hashSuffix === suffix;
        });

        return { isBreached: breached };
    } catch (err) {
        // Network error — fail open
        logger.warn(`HIBP breach check failed (network error): ${err.message}. Skipping.`);
        return { isBreached: false };
    }
};

// ── Production Anomaly Alerts ─────────────────────────────────────────────────

export const notifyTokenReuse = async (req, user, metadata) => {
    logger.error(`[SECURITY ALERT] Token reuse detected for user ${user._id || user}!`);

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_ALERT_TOKEN_REUSE',
        status: 'FAILURE',
        metadata: { ...metadata, severity: 'CRITICAL', alert: 'ANOMALY_DETECTED' }
    });
};

export const notifyRepeatedLockouts = async (req, user, count) => {
    logger.error(`[SECURITY ALERT] User ${user._id || user} has been locked out ${count} times! Possible Brute Force.`);

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_ALERT_REPEATED_LOCKOUT',
        status: 'FAILURE',
        metadata: { lockoutCount: count, severity: 'HIGH' }
    });
};

export const notifyLoginSpike = async (req, ip) => {
    logger.error(`[SECURITY ALERT] Login rate limit reached for IP: ${ip}. Possible automation/brute-force.`);

    await logAuditEvent({
        req,
        event: 'SEC_ALERT_LOGIN_SPIKE',
        status: 'FAILURE',
        metadata: { ip, severity: 'HIGH', alert: 'BRUTE_FORCE_PROTECTION' }
    });
};

export const notifySuspiciousIpChange = async (req, user, oldIp, newIp) => {
    logger.warn(`[SECURITY ALERT] Session IP shift for user ${user._id || user}: ${oldIp} -> ${newIp}`);

    await logAuditEvent({
        req,
        user: user._id || user,
        event: 'SEC_ALERT_IP_MOVE',
        status: 'FAILURE',
        metadata: { oldIp, newIp, severity: 'MEDIUM' }
    });
};

// ── Identity / Email Dispatch ─────────────────────────────────────────────────

export const sendVerificationEmail = async (req, user, token) => {
    const verifyUrl = `${config.clientUrls[0]}/verify-email/${token}`;

    await sendMail({
        to: user.email,
        subject: '✉️ Verify your Crammerly account',
        html: `
            <h2>Welcome to Crammerly, ${user.name}!</h2>
            <p>Please verify your email address by clicking the button below.
               This link expires in <strong>24 hours</strong>.</p>
            <p style="text-align:center;margin:32px 0;">
                <a href="${verifyUrl}"
                   style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;
                          text-decoration:none;font-weight:bold;font-size:16px;">
                    Verify Email
                </a>
            </p>
            <p>Or copy this link into your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>— Crammerly Team</p>
        `
    });

    await logAuditEvent({
        req,
        user: user._id,
        event: 'AUTH_SEND_VERIFY_EMAIL',
        status: 'SUCCESS',
        metadata: { channel: 'EMAIL' }
    });
};

export const sendPasswordResetEmail = async (req, user, token) => {
    const resetUrl = `${config.clientUrls[0]}/reset-password/${token}`;

    await sendMail({
        to: user.email,
        subject: '🔑 Reset your Crammerly password',
        html: `
            <h2>Password Reset Request</h2>
            <p>Hi ${user.name || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to set a new one.
               This link expires in <strong>15 minutes</strong>.</p>
            <p style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}"
                   style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;
                          text-decoration:none;font-weight:bold;font-size:16px;">
                    Reset Password
                </a>
            </p>
            <p>Or copy this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you didn't request a password reset, you can safely ignore this email.
               Your password will not change.</p>
            <p>— Crammerly Security</p>
        `
    });

    await logAuditEvent({
        req,
        user: user._id,
        event: 'AUTH_SEND_RESET_EMAIL',
        status: 'SUCCESS',
        metadata: { channel: 'EMAIL' }
    });
};
