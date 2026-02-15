import Session from '../models/Session.js';
import { hashToken } from '../utils/tokenService.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';
import { notifySessionRevoked } from '../utils/securityNotifier.js';

/**
 * @desc    Get user sessions
 * @route   GET /api/sessions
 * @access  Private
 */
export const getSessions = async (req, res, next) => {
    try {
        const currentToken = req.cookies.refreshToken;
        const currentTokenHash = currentToken ? hashToken(currentToken) : null;

        const sessions = await Session.find({
            user: req.user._id,
            isValid: true,
            expiresAt: { $gt: new Date() }
        }).sort({ lastUsedAt: -1 });

        // Map to sanitize data (remove hashes)
        const sanitizedSessions = sessions.map(s => ({
            id: s._id,
            deviceName: s.deviceName,
            userAgent: s.userAgent,
            ipAddress: s.ipAddress,
            lastUsedAt: s.lastUsedAt,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
            isCurrent: s.refreshTokenHash === currentTokenHash
        }));

        return res.sendSuccess(sanitizedSessions);
    } catch (error) {

        next(error);
    }
};

/**
 * @desc    Revoke user session
 * @route   DELETE /api/sessions/:id
 * @access  Private
 */
export const revokeSession = async (req, res, next) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!session) {
            const error = new Error('Session not found');
            error.statusCode = 404;
            error.code = 'RES_NOT_FOUND';
            return next(error);
        }

        session.isValid = false;
        session.revokedAt = new Date();
        await session.save();

        await notifySessionRevoked(req, req.user, `Manual revocation of session ${session._id}`);

        await logAuditEvent({
            req,
            user: req.user._id,
            event: 'SESSION_REVOKE',
            status: 'SUCCESS',
            metadata: { sessionId: session._id }
        });

        return res.sendSuccess({ message: 'Session revoked successfully' });
    } catch (error) {

        next(error);
    }
};
