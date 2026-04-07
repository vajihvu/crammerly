import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import config from '../config/index.js';
import { notifyTokenReuse, notifySuspiciousIpChange } from './securityNotifier.js';
import { logger } from './logger.js';

export const generateAccessToken = (user, sessionId) => {
    if (!sessionId) {
        throw new Error('Access token generation requires an active sessionId for security binding.');
    }

    const payload = {
        id: user._id || user.id,
        sessionId: sessionId,
        tokenVersion: user.tokenVersion ?? 0
    };

    const secret = config.jwt.secret;

    return jwt.sign(payload, secret, {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
    });
};

export const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const normalizeIp = (ip) => (ip && ip.startsWith('::ffff:') ? ip.substring(7) : ip);

export const rotateRefreshToken = async (req, oldToken, userAgent, ipAddress) => {
    const oldHash = hashToken(oldToken);

    // 0. Check for invalid or reuse globally
    const session = await Session.findOne({
        $or: [
            { refreshTokenHash: oldHash },
            { previousTokenHashes: oldHash }
        ]
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
        const error = new Error('Invalid or expired refresh token');
        error.code = 'AUTH_REVOKED';
        error.statusCode = 401;
        throw error;
    }

    const userId = session.user;

    // Reuse detection: If the token is in previousTokenHashes, it was already rotated.
    if (session.previousTokenHashes.includes(oldHash)) {
        // GRACE PERIOD: Allow a small window (10s) for race conditions (e.g. multi-tab refresh)
        // If the session was updated very recently, it's likely a legitiate race.
        const gap = Date.now() - new Date(session.updatedAt).getTime();
        if (gap < 10000) {
            logger.warn(`♻️ Rotation race detected for user ${userId}. Token already replaced ${gap}ms ago. Returning 401 without revocation.`);
            const error = new Error('Token rotation race detected. Please retry with the new token.');
            error.statusCode = 401;
            error.code = 'AUTH_ROTATION_RACE';
            throw error;
        }

        logger.error(`🚨 CRITICAL: Refresh token reuse detected for user ${userId}. Revoking session family.`);
        session.isValid = false;
        session.isSuspicious = true;

        session.revokedAt = new Date();
        await session.save();
        // Revoke ALL sessions for this user for maximum safety
        await Session.updateMany(
            { user: userId, isValid: true },
            { isValid: false, revokedAt: new Date() }
        );

        // ALERT: Token reuse is a high-confidence indicator of theft
        await notifyTokenReuse(req, { _id: userId }, { tokenHash: oldHash });

        throw new Error('Security breach detected: Token reuse');
    }

    // 1. Detection: Same token from different IP — Alert but don't revoke
    // IP changes are common (VPN, mobile WiFi→LTE). Revoking here causes
    // constant logouts for legitimate users and is a DoS vector.
    const currentIp = normalizeIp(ipAddress);
    const lastIp = normalizeIp(session.ipAddress);

    if (lastIp && currentIp && lastIp !== currentIp) {
        logger.warn(`SECURITY NOTICE: Session IP changed for user ${userId}. Previous: ${lastIp}, Current: ${currentIp}. Allowing session but logging alert.`);
        // Alert the user via email — they can revoke via session management if needed
        await notifySuspiciousIpChange(req, { _id: userId }, lastIp, currentIp);
    }

    // 2. Detection: Excessive refresh attempts
    session.refreshCount += 1;
    if (session.refreshCount > 50) { // Slightly stricter for production
        logger.warn(`SECURITY ALERT: Excessive refresh attempts for user ${userId}. Revoking session.`);
        session.isValid = false;
        session.revokedAt = new Date();
        await session.save();
        const error = new Error('Security policy: Excessive refresh attempts detected.');
        error.code = 'SEC_SESSION_EXCESSIVE';
        error.statusCode = 401;
        throw error;
    }

    // 3. Rotation Logic: Strictly ordered to prevent race conditions or partial updates
    const newToken = generateRefreshToken();
    const newHash = hashToken(newToken);

    // Record history for vaulting/reuse detection
    session.previousTokenHashes.push(session.refreshTokenHash);

    // Keep history manageable (last 5 tokens)
    if (session.previousTokenHashes.length > 5) {
        session.previousTokenHashes.shift();
    }

    // Update with new credentials
    session.refreshTokenHash = newHash;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days rolling
    session.lastUsedAt = new Date();
    session.userAgent = userAgent || session.userAgent;
    session.ipAddress = currentIp;

    await session.save();

    return newToken;
};
