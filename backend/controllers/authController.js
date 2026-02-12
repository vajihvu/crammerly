import User from '../models/User.js';
import Session from '../models/Session.js';
import Todo from '../models/Todo.js';
import Record from '../models/Record.js';
import config from '../config/index.js';
import {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    rotateRefreshToken
} from '../utils/tokenService.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';
import {
    notifyNewDeviceLogin,
    notifyPasswordChange,
    checkBreachedPassword
} from '../utils/securityNotifier.js';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (Matches config.jwt.refreshExpiresIn logic)
};

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 */
export const registerUser = async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'DUPLICATE' } });
            const error = new Error('User already exists');
            error.statusCode = 400;
            error.code = 'RES_DUPLICATE';
            return next(error);
        }

        // 0. Policy: Breach Check
        const breachStatus = await checkBreachedPassword(password);
        if (breachStatus.isBreached) {
            await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'BREACHED_PASSWORD' } });
            const error = new Error(`Security Alert: This password was found in a public data breach. Please choose a more secure password.`);
            error.statusCode = 400;
            error.code = 'SEC_PWD_BREACHED';
            return next(error);
        }

        const user = await User.create({ name, email, password });

        // Simple device detection
        const userAgent = req.headers['user-agent'] || 'Unknown';
        let deviceName = 'Unknown Device';
        if (userAgent.includes('Windows')) deviceName = 'Windows PC';
        else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
        else if (userAgent.includes('Android')) deviceName = 'Android Device';
        else if (userAgent.includes('iPhone')) deviceName = 'iPhone';

        // Create session
        const refreshToken = generateRefreshToken();
        await Session.create({
            user: user._id,
            refreshTokenHash: hashToken(refreshToken),
            userAgent,
            deviceName,
            ipAddress: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await logAuditEvent({ req, user: user._id, event: 'AUTH_REGISTER', status: 'SUCCESS' });

        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateAccessToken(user)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 */
export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password loginAttempts lockUntil requiresCaptcha');

        if (!user) {
            await logAuditEvent({ req, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { email, reason: 'NOT_FOUND' } });
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            error.code = 'AUTH_INVALID';
            throw error;
        }

        // 1. Check if account is locally locked
        if (user.isLocked) {
            await logAuditEvent({ req, user: user._id, event: 'AUTH_LOCKOUT_HIT', status: 'FAILURE' });
            const error = new Error('Account temporarily locked due to too many failed attempts. Try again in 30 minutes.');
            error.statusCode = 423; // Locked
            error.code = 'AUTH_LOCKED';
            throw error;
        }

        const isMatch = await user.matchPassword(password);

        if (isMatch) {
            // Simple device detection
            const userAgent = req.headers['user-agent'] || 'Unknown';
            let deviceName = 'Unknown Device';
            if (userAgent.includes('Windows')) deviceName = 'Windows PC';
            else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
            else if (userAgent.includes('Android')) deviceName = 'Android Device';
            else if (userAgent.includes('iPhone')) deviceName = 'iPhone';

            // New Device Notification Logic
            const existingSession = await Session.findOne({
                user: user._id,
                isValid: true,
                userAgent,
                ipAddress: req.ip
            });

            if (!existingSession) {
                await notifyNewDeviceLogin(req, user, { userAgent, ipAddress: req.ip, deviceName });
            }

            // Create session
            const refreshToken = generateRefreshToken();
            await Session.create({
                user: user._id,
                refreshTokenHash: hashToken(refreshToken),
                userAgent,
                deviceName,
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            // Reset attempts on success
            await user.resetLoginAttempts();

            await logAuditEvent({ req, user: user._id, event: 'AUTH_LOGIN', status: 'SUCCESS' });

            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    token: generateAccessToken(user)
                }
            });
        } else {
            // Increment failures on password mismatch
            await user.incLoginAttempts();

            await logAuditEvent({ req, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { email, reason: 'PASSWORD_MISMATCH' } });

            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            error.code = 'AUTH_INVALID';

            // Hint for frontend if captcha might be needed next time
            if (user.loginAttempts + 1 >= 3) {
                error.meta = { requiresCaptcha: true };
            }

            throw error;
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 */
export const refreshAccessToken = async (req, res, next) => {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) {
        const error = new Error('Refresh token missing');
        error.statusCode = 401;
        error.code = 'AUTH_EXPIRED';
        return next(error);
    }

    try {
        const hash = hashToken(oldRefreshToken);
        const session = await Session.findOne({ refreshTokenHash: hash, isValid: true });

        if (!session) {
            const error = new Error('Invalid or expired session');
            error.statusCode = 401;
            error.code = 'AUTH_REVOKED';
            throw error;
        }

        const newRefreshToken = await rotateRefreshToken(
            oldRefreshToken,
            session.user,
            req.headers['user-agent'],
            req.ip
        );

        const user = await User.findById(session.user);
        if (!user) throw new Error('User not found');

        await logAuditEvent({ req, user: session.user, event: 'AUTH_REFRESH', status: 'SUCCESS' });

        res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
        res.json({
            success: true,
            data: { token: generateAccessToken(user) }
        });
    } catch (error) {
        await logAuditEvent({ req, event: 'AUTH_REFRESH', status: 'FAILURE', metadata: { reason: error.message } });
        console.error('Refresh Token Error:', error.message);
        res.clearCookie('refreshToken');
        if (!error.statusCode) error.statusCode = 401;
        if (!error.code) error.code = 'AUTH_INVALID';
        next(error);
    }
};

/**
 * @desc    Logout user & revoke session
 * @route   POST /api/v1/auth/logout
 */
export const logoutUser = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const hash = hashToken(refreshToken);
            await Session.deleteOne({ refreshTokenHash: hash });
            await logAuditEvent({ req, event: 'AUTH_LOGOUT', status: 'SUCCESS' });
        }
        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email } });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

export const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('+password +previousPasswords');
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        const passwordChanged = !!req.body.password;
        if (passwordChanged) {
            const newPassword = req.body.password;

            // 1. Policy: Breach Check
            const breachStatus = await checkBreachedPassword(newPassword);
            if (breachStatus.isBreached) {
                const error = new Error('Security Alert: This password was found in a public data breach. Please choose a more secure password.');
                error.statusCode = 400;
                error.code = 'SEC_PWD_BREACHED';
                throw error;
            }

            // 2. Policy: Reuse Prevention
            const isReused = await user.isPasswordPreviouslyUsed(newPassword);
            if (isReused) {
                const error = new Error('Security Policy: You cannot reuse a recent password. Please choose a new one.');
                error.statusCode = 400;
                error.code = 'SEC_PWD_REUSE';
                throw error;
            }

            // 3. Update history before hashing new one
            user.previousPasswords.unshift(user.password);
            if (user.previousPasswords.length > 5) {
                user.previousPasswords.pop();
            }

            // 4. Set new password (hashing happens in pre-save hook)
            user.password = newPassword;

            // 5. Revoke all existing sessions
            await Session.updateMany({ user: user._id }, { isValid: false });

            // 6. Notify user
            await notifyPasswordChange(req, user);
        }

        const updatedUser = await user.save();

        // If password changed, issue new refresh token & session
        if (passwordChanged) {
            const refreshToken = generateRefreshToken();
            await Session.create({
                user: user._id,
                refreshTokenHash: hashToken(refreshToken),
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
        }

        res.json({
            success: true,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                token: generateAccessToken(updatedUser)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const deactivateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.isActive = false;
            await user.save();
            await Session.deleteMany({ user: user._id }); // Revoke all sessions
            await logAuditEvent({ req, user: user._id, event: 'USER_DEACTIVATE', status: 'SUCCESS' });
            res.clearCookie('refreshToken');
            res.json({ success: true, message: 'Account deactivated successfully' });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user onboarding state
 * @route   GET /api/v1/auth/onboarding
 * @access  Private
 */
export const getOnboardingState = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const steps = [
            { id: 'profile', label: 'Complete Profile', done: !!user.name },
            { id: 'todo', label: 'Create First Todo', done: (await Todo.countDocuments({ user_id: user._id })) > 0 },
            { id: 'record', label: 'Log First Study Session', done: (await Record.countDocuments({ userId: user._id })) > 0 }
        ];

        res.json({
            success: true,
            data: {
                isOnboarded: user.isOnboarded,
                steps,
                nextStep: steps.find(s => !s.done) || null
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Mark onboarding as complete
 * @route   POST /api/v1/auth/onboarding/complete
 * @access  Private
 */
export const completeOnboarding = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { isOnboarded: true });
        res.json({ success: true, message: 'Onboarding completed! Welcome to the premium experience.' });
    } catch (error) {
        next(error);
    }
};
