import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';
import config from '../config/index.js';

export const generateAccessToken = (userOrId) => {
    const isObject = typeof userOrId === 'object' && userOrId !== null;
    const userId = isObject ? (userOrId._id || userOrId.id) : userOrId;
    const email = isObject ? userOrId.email : '';
    const name = isObject ? userOrId.name : '';

    const payload = {
        id: userId,
        email: email,
        name: name
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

const normalizeIp = (ip) => (ip && ip.startsWith('::ffff:') ? ip.substring(7) : ip);

export const rotateRefreshToken = async (oldToken, userId, userAgent, ipAddress) => {
    const oldHash = hashToken(oldToken);

    // 0. Check for invalid or reuse
    const session = await Session.findOne({
        user: userId,
        $or: [
            { refreshTokenHash: oldHash },
            { previousTokenHashes: oldHash }
        ]
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
    }

    // Reuse detection: If the token is in previousTokenHashes, it was already rotated.
    if (session.previousTokenHashes.includes(oldHash)) {
        console.error(`🚨 CRITICAL: Refresh token reuse detected for user ${userId}. Revoking session family.`);
        session.isValid = false;
        session.isSuspicious = true;
        await session.save();
        // Option: Revoke ALL sessions for this user for maximum safety
        await Session.updateMany({ user: userId }, { isValid: false });
        throw new Error('Security breach detected: Token reuse');
    }

    // 1. Detection: Same token from different IP
    const currentIp = normalizeIp(ipAddress);
    const lastIp = normalizeIp(session.ipAddress);

    if (lastIp && currentIp && lastIp !== currentIp) {
        console.warn(`SECURITY ALERT: Session IP mismatch for user ${userId}. Revoking session.`);
        session.isValid = false;
        session.isSuspicious = true;
        await session.save();
        const error = new Error('Session anomaly: IP address mismatch');
        error.code = 'SEC_SESSION_ANOMALY';
        error.statusCode = 401;
        throw error;
    }

    // 2. Detection: Excessive refresh attempts
    session.refreshCount += 1;
    if (session.refreshCount > 100) {
        console.warn(`SECURITY ALERT: Excessive refresh attempts for user ${userId}. Revoking session.`);
        session.isValid = false;
        await session.save();
        const error = new Error('Session anomaly: Excessive refresh attempts');
        error.code = 'SEC_SESSION_EXCESSIVE';
        error.statusCode = 401;
        throw error;
    }

    // Generate new token
    const newToken = generateRefreshToken();
    const newHash = hashToken(newToken);

    // Update session (Rotate)
    session.previousTokenHashes.push(oldHash);
    // Keep history manageable (last 5 tokens)
    if (session.previousTokenHashes.length > 5) {
        session.previousTokenHashes.shift();
    }
    session.refreshTokenHash = newHash;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    session.lastUsedAt = new Date();
    session.userAgent = userAgent || session.userAgent;
    session.ipAddress = currentIp; // Store normalized IP
    await session.save();

    return newToken;
};
