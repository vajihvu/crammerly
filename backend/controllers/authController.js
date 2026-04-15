import User from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import Session from '../models/Session.js';
import Todo from '../models/Todo.js';
import Record from '../models/Record.js';
import config from '../config/index.js';
import {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    rotateRefreshToken,
    generateVerificationToken
} from '../utils/tokenService.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';
import { parseDeviceName } from '../utils/parseDevice.js';
import logger from '../utils/logger.js';
import {
    notifyNewDeviceLogin,
    notifyPasswordChange,
    notifyRepeatedLockouts,
    checkBreachedPassword,
    sendVerificationEmail,
    sendPasswordResetEmail
} from '../utils/securityNotifier.js';
import { validatePasswordStrength } from '../utils/passwordPolicy.js';
import asyncHandler from '../utils/asyncHandler.js';

export const formatUserPayload = (user) => ({
    id: user._id,
    _id: user._id, // Keep both for backward compatibility
    email: user.email,
    name: user.name,
    username: user.username || undefined,
    tag: user.tag ? user.tag.toString().slice(0, 4) : undefined,
    avatar: user.avatar || undefined,
    institution: user.institution || undefined,
    course: user.course || undefined,
    interests: user.interests || [],
    skills: user.skills || [],
    socialLinks: user.socialLinks || {},
    bio: user.bio || undefined,
    settings: user.settings || undefined,
    isOnboarded: user.isOnboarded || false,
    isActive: user.isActive,
    role: user.role
});

const client = new OAuth2Client(config.googleClientId);

const COOKIE_OPTIONS = {
    path: '/api/v1/auth',
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'none' : 'strict', // 'none' required for cross-site cookie transmission
    domain: config.jwt.cookieDomain || undefined, // Explicitly set domain for cross-subdomain support
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (Matches config.jwt.refreshExpiresIn logic)
};


/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 */
export const registerUser = asyncHandler(async (req, res) => {
    let { name, email, password } = req.body;
    email = email.toLowerCase().trim();

    const userExists = await User.findOne({ email });
    if (userExists) {
        await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'DUPLICATE' } });
        return res.sendError('User already exists', 400, 'RES_DUPLICATE');
    }

    // 0. Policy: Breach Check
    const breachStatus = await checkBreachedPassword(password);
    if (breachStatus.isBreached) {
        await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'BREACHED_PASSWORD' } });
        return res.sendError(`Security Alert: This password was found in a public data breach. Please choose a more secure password.`, 400, 'SEC_PWD_BREACHED');
    }

    // 1. Policy: Entropy & Pattern Check
    const strength = validatePasswordStrength(password, [name, email]);
    if (!strength.isValid) {
        await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'WEAK_ENTROPY' } });
        return res.sendError(`Security Policy: ${strength.feedback}. ${strength.suggestion || ''}`, 400, 'SEC_PWD_WEAK');
    }

    // 2. Policy: Email Verification Setup
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let user;
    try {
        user = await User.create({
            name,
            email,
            password,
            isEmailVerified: false,
            emailVerificationToken: hashToken(verificationToken),
            emailVerificationExpires: verificationExpires
        });
    } catch (error) {
        if (error.code === 11000) {
            await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'RACE_CONDITION_DUPLICATE' } });
            return res.sendError('User with this email or tag already exists', 400, 'RES_DUPLICATE');
        }
        throw error;
    }

    await logAuditEvent({ req, user: user._id, event: 'AUTH_REGISTER', status: 'SUCCESS', metadata: { method: 'EMAIL' } });

    // 3. Dispatch Verification Email — fire-and-forget so registration responds immediately
    sendVerificationEmail(req, user, verificationToken)
        .catch(emailErr => logger.error(`Failed to send verification email to ${user.email}: ${emailErr.message}`));

    return res.sendSuccess({
        message: 'Registration successful! Please check your email and verify your account to log in.',
        user: formatUserPayload(user),
        // Only expose token in dev for simulator/testing ease
        ...(config.isProduction ? {} : { verificationToken })
    }, 201);
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();

    const user = await User.findOne({ email }).select('+password +tokenVersion');

    if (!user) {
        await logAuditEvent({ req, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { email, reason: 'NOT_FOUND' } });
        return res.sendError('Invalid email or password', 401, 'AUTH_INVALID');
    }

    // 0. Verify Email Status
    if (!user.isEmailVerified) {
        await logAuditEvent({ req, user: user._id, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { reason: 'EMAIL_UNVERIFIED' } });
        return res.sendError('Your email is not verified. Please check your inbox for the activation link.', 403, 'AUTH_UNVERIFIED');
    }

    // 1. Check if account is locally locked
    if (user.isLocked) {
        await logAuditEvent({ req, user: user._id, event: 'AUTH_LOCKOUT_HIT', status: 'FAILURE' });
        return res.sendError('Account temporarily locked due to too many failed attempts. Try again in 30 minutes.', 423, 'AUTH_LOCKED');
    }

    const isMatch = await user.matchPassword(password);

    if (isMatch) {
        // Shared device detection
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const deviceName = parseDeviceName(userAgent);

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
        const session = await Session.create({
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
        return res.sendSuccess({
            token: generateAccessToken(user, session._id),
            refreshToken, // Fallback for 3rd-party cookie blocking
            user: formatUserPayload(user)
        });
    } else {
        // Increment failures on password mismatch
        await user.incLoginAttempts();

        // RE-FETCH: To get updated loginAttempts and totalLockouts if changed by incLoginAttempts
        const updatedUser = await User.findById(user._id).select('loginAttempts totalLockouts lockUntil email');

        // ALERT: Repeated Lockouts (Brute Force Anomaly)
        if (updatedUser.totalLockouts >= 3) {
            await notifyRepeatedLockouts(req, updatedUser, updatedUser.totalLockouts);
        }

        await logAuditEvent({ req, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { email, reason: 'PASSWORD_MISMATCH' } });

        // Hint for frontend if captcha might be needed next time
        const meta = user.loginAttempts + 1 >= 3 ? { requiresCaptcha: true } : {};
        return res.sendError('Invalid email or password', 401, 'AUTH_INVALID', meta);
    }
});

export const googleLogin = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.sendError('Google token is missing', 400);
    }

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.googleClientId,
    });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            email,
            name,
            googleId: sub,
            avatar: picture,
            isEmailVerified: true
        });
        await logAuditEvent({ req, user: user._id, event: 'AUTH_REGISTER', status: 'SUCCESS', metadata: { method: 'GOOGLE' } });
    } else if (!user.googleId) {
        // Security: Do NOT auto-link Google to an existing local account.
        await logAuditEvent({ req, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { email, reason: 'GOOGLE_LINK_DENIED' } });
        return res.sendError('An account with this email already exists. Please log in with your password first, then link Google from your profile settings.', 409, 'AUTH_ACCOUNT_CONFLICT');
    }

    // Create session
    const refreshToken = generateRefreshToken();
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceName = parseDeviceName(userAgent);

    const session = await Session.create({
        user: user._id,
        refreshTokenHash: hashToken(refreshToken),
        userAgent,
        deviceName,
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await logAuditEvent({ req, user: user._id, event: 'AUTH_LOGIN', status: 'SUCCESS', metadata: { method: 'GOOGLE' } });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    return res.sendSuccess({
        token: generateAccessToken(user, session._id),
        refreshToken, // Fallback for 3rd-party cookie blocking
        user: formatUserPayload(user)
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const oldRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
    if (!oldRefreshToken) {
        return res.sendError('Refresh token missing', 401, 'AUTH_EXPIRED');
    }

    try {
        const newRefreshToken = await rotateRefreshToken(
            req,
            oldRefreshToken,
            req.headers['user-agent'],
            req.ip
        );

        const hash = hashToken(newRefreshToken);
        const session = await Session.findOne({ refreshTokenHash: hash });
        const user = await User.findById(session.user);
        if (!user) throw new Error('User not found');

        await logAuditEvent({ req, user: session.user, event: 'AUTH_REFRESH', status: 'SUCCESS' });

        res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
        return res.sendSuccess({
            token: generateAccessToken(user, session._id),
            refreshToken: newRefreshToken // Fallback for 3rd-party cookie blocking
        });

    } catch (error) {
        await logAuditEvent({ req, event: 'AUTH_REFRESH', status: 'FAILURE', metadata: { reason: error.message } });
        
        // Clear cookie for ALL fatal errors to ensure browser state is reset. 
        const isTransient = (error.statusCode === 401 && error.code === 'AUTH_ROTATION_RACE') || error.statusCode === 429;
        if (!isTransient) {
            res.clearCookie('refreshToken', COOKIE_OPTIONS);
        }
        
        return res.sendError(error.message, error.statusCode || 401, error.code || 'AUTH_INVALID');
    }
});

/**
 * @desc    Logout user & revoke session
 * @route   POST /api/v1/auth/logout
 */
export const logoutUser = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
        if (refreshToken) {
            const hash = hashToken(refreshToken);
            const session = await Session.findOne({ refreshTokenHash: hash });

            if (session) {
                session.isValid = false;
                session.revokedAt = new Date();
                await session.save();
            }

            await logAuditEvent({ req, event: 'AUTH_LOGOUT', status: 'SUCCESS' });
        }

        res.clearCookie('refreshToken', COOKIE_OPTIONS);
        return res.sendSuccess({ message: 'Logged out' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout all devices
 * @route   POST /api/v1/auth/logout-all
 */
export const logoutAllDevices = async (req, res, next) => {
    try {
        // Increment tokenVersion to revoke all current access tokens
        await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });

        await Session.updateMany(
            { user: req.user._id, isValid: true },
            { isValid: false, revokedAt: new Date() }
        );

        await logAuditEvent({ req, user: req.user._id, event: 'AUTH_LOGOUT_ALL', status: 'SUCCESS' });
        res.clearCookie('refreshToken', COOKIE_OPTIONS);
        return res.sendSuccess({ message: 'Logged out from all devices' });
    } catch (error) {
        next(error);
    }
};



export const getUserProfile = async (req, res) => {
    return res.sendSuccess(formatUserPayload(req.user));
};

export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password +previousPasswords +tokenVersion');
    if (!user) {
        return res.sendError('User not found', 404, 'RES_NOT_FOUND');
    }

    user.name = req.body.name || user.name;

    // Email change requires re-verification
    if (req.body.email && req.body.email.toLowerCase().trim() !== user.email) {
        const newEmail = req.body.email.toLowerCase().trim();
        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) {
            return res.sendError('This email is already in use by another account.', 400, 'RES_DUPLICATE');
        }
        const verificationToken = generateVerificationToken();
        user.pendingEmail = newEmail;
        user.pendingEmailToken = hashToken(verificationToken);
        user.pendingEmailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await sendVerificationEmail(req, { ...user.toObject(), email: newEmail }, verificationToken);
    }

    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.institution !== undefined) user.institution = req.body.institution;
    if (req.body.course !== undefined) user.course = req.body.course;
    if (req.body.username !== undefined) user.username = req.body.username;
    if (req.body.interests !== undefined) user.interests = req.body.interests;
    if (req.body.skills !== undefined) user.skills = req.body.skills;
    if (req.body.socialLinks !== undefined) user.socialLinks = req.body.socialLinks;
    if (req.body.avatarUrl !== undefined) user.avatar = req.body.avatarUrl;

    if (req.body.settings !== undefined) {
        if (!user.settings) user.settings = {};
        if (req.body.settings.language !== undefined) user.settings.language = req.body.settings.language;
        if (req.body.settings.privacy !== undefined) {
            if (!user.settings.privacy) user.settings.privacy = {};
            if (req.body.settings.privacy.allowInvites !== undefined) user.settings.privacy.allowInvites = req.body.settings.privacy.allowInvites;
            if (req.body.settings.privacy.showOnlineStatus !== undefined) user.settings.privacy.showOnlineStatus = req.body.settings.privacy.showOnlineStatus;
            if (req.body.settings.privacy.allowDMs !== undefined) user.settings.privacy.allowDMs = req.body.settings.privacy.allowDMs;
        }
        user.markModified('settings');
    }

    const passwordChanged = !!req.body.password;
    if (passwordChanged) {
        const newPassword = req.body.password;
        const breachStatus = await checkBreachedPassword(newPassword);
        if (breachStatus.isBreached) {
            return res.sendError('Security Alert: This password was found in a public data breach. Please choose a more secure password.', 400, 'SEC_PWD_BREACHED');
        }

        const isReused = await user.isPasswordPreviouslyUsed(newPassword);
        if (isReused) {
            return res.sendError('Security Policy: You cannot reuse a recent password. Please choose a new one.', 400, 'SEC_PWD_REUSE');
        }

        const strength = validatePasswordStrength(newPassword, [user.name, user.email]);
        if (!strength.isValid) {
            return res.sendError(`Security Policy: ${strength.feedback}. ${strength.suggestion || ''}`, 400, 'SEC_PWD_WEAK');
        }

        user.password = newPassword;
        await Session.updateMany({ user: user._id, isValid: true }, { isValid: false, revokedAt: new Date() });
        await notifyPasswordChange(req, user);
    }

    let updatedUser;
    try {
        updatedUser = await user.save();
    } catch (saveError) {
        if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.username) {
            return res.sendError('This username already exists', 400, 'RES_DUPLICATE');
        }
        throw saveError;
    }

    let newSessionId = req.sessionId;
    let newRefreshToken;
    if (passwordChanged) {
        newRefreshToken = generateRefreshToken();
        const session = await Session.create({
            user: user._id,
            refreshTokenHash: hashToken(newRefreshToken),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
        newSessionId = session._id;
        res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);
    }

    return res.sendSuccess({
        user: formatUserPayload(updatedUser),
        token: passwordChanged ? generateAccessToken(updatedUser, newSessionId) : undefined,
        refreshToken: passwordChanged ? newRefreshToken : undefined
    });
});

export const deactivateUser = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
        return res.sendError('User not found', 404, 'RES_NOT_FOUND');
    }

    if (user.password) {
        if (!password || !(await user.matchPassword(password))) {
            return res.sendError('Incorrect password. Account deactivation requires confirmation.', 401, 'AUTH_INVALID');
        }
    }

    user.isActive = false;
    await user.save();
    await Session.updateMany({ user: user._id, isValid: true }, { isValid: false, revokedAt: new Date() });

    await logAuditEvent({ req, user: user._id, event: 'USER_DEACTIVATE', status: 'SUCCESS' });
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return res.sendSuccess({ message: 'Account deactivated successfully' });
});


/**
 * @desc    Get user onboarding state
 * @route   GET /api/v1/auth/onboarding
 * @access  Private
 */
export const getOnboardingState = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.sendError('User not found', 404, 'RES_NOT_FOUND');
    }

    const [todoCount, recordCount] = await Promise.all([
        Todo.countDocuments({ user_id: user._id }),
        Record.countDocuments({ userId: user._id })
    ]);

    const steps = [
        { id: 'profile', label: 'Complete Profile', done: !!user.name },
        { id: 'todo', label: 'Create First Todo', done: todoCount > 0 },
        { id: 'record', label: 'Log First Study Session', done: recordCount > 0 }
    ];

    return res.sendSuccess({
        isOnboarded: user.isOnboarded,
        steps,
        nextStep: steps.find(s => !s.done) || null
    });
});

/**
 * @desc    Mark onboarding as complete
 * @route   POST /api/v1/auth/onboarding/complete
 * @access  Private
 */
export const completeOnboarding = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { isOnboarded: true });
    return res.sendSuccess({ message: 'Onboarding completed! Welcome to the premium experience.' });
});

/**
 * @desc    Get all active sessions for the user
 * @route   GET /api/v1/auth/sessions
 * @access  Private
 */
export const getUserSessions = async (req, res, next) => {
    try {
        const sessions = await Session.find({
            user: req.user._id,
            isValid: true,
            expiresAt: { $gt: new Date() }
        }).sort({ lastUsedAt: -1 }).lean();

        // Need hashToken to identify current session from cookie
        const { hashToken } = await import('../utils/tokenService.js');

        // Identify current session by matching the refresh token hash if cookie exists
        let currentSessionHash = null;
        if (req.cookies.refreshToken) {
            currentSessionHash = hashToken(req.cookies.refreshToken);
        }

        const formattedSessions = sessions.map(s => ({
            id: s._id,
            deviceName: s.deviceName,
            ipAddress: s.ipAddress,
            userAgent: s.userAgent,
            lastUsedAt: s.lastUsedAt,
            isCurrent: s.refreshTokenHash === currentSessionHash
        }));

        return res.sendSuccess(formattedSessions);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Revoke a specific session
 * @route   DELETE /api/v1/auth/sessions/:id
 * @access  Private
 */
export const revokeSession = async (req, res, next) => {
    try {
        const session = await Session.findById(req.params.id);

        if (!session) {
            const error = new Error('Session record not found.');
            error.statusCode = 404;
            error.code = 'RES_NOT_FOUND';
            throw error;
        }

        // Ownership Check: Only the owner can revoke their own device sessions
        if (session.user.toString() !== req.user._id.toString()) {
            logger.warn(`SECURITY ALERT: User ${req.user._id} attempted to revoke session ${session._id} belonging to user ${session.user}`);
            const error = new Error('Access Denied: You do not have permission to revoke this session.');
            error.statusCode = 403;
            error.code = 'AUTH_FORBIDDEN';
            throw error;
        }

        session.isValid = false;
        session.revokedAt = new Date();
        await session.save();

        await logAuditEvent({
            req,
            user: req.user._id,
            event: 'AUTH_SESSION_REVOKE',
            status: 'SUCCESS',
            metadata: { sessionId: session._id, device: session.deviceName }
        });

        return res.sendSuccess({ message: 'Session revoked successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Verify email using token
 * @route   GET /api/v1/auth/verify-email/:token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    }).select('+password +previousPasswords');

    if (!user) {
        return res.sendSuccess({
            message: 'This verification link has already been used or has expired. If you already verified, you can log in now.',
            alreadyVerified: true
        });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await logAuditEvent({ req, user: user._id, event: 'AUTH_VERIFY_EMAIL', status: 'SUCCESS' });

    return res.sendSuccess({ message: 'Email verified successfully! You can now log in.' });
});

/**
 * @desc    Request password reset token
 * @route   POST /api/v1/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
        // Security: Don't reveal if user exists
        return res.sendSuccess({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const resetToken = generateVerificationToken();
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes (Short Expiry Policy)

    await user.save();

    await logAuditEvent({ req, user: user._id, event: 'AUTH_PWD_RESET_REQUEST', status: 'SUCCESS' });

    // 3. Dispatch Reset Loop
    await sendPasswordResetEmail(req, user, resetToken);

    return res.sendSuccess({
        message: 'If an account exists with that email, a password reset link has been sent to your inbox.',
        // Only expose token in dev for simulator/testing ease
        ...(config.isProduction ? {} : { resetToken })
    });
});

/**
 * @desc    Reset password using token
 * @route   POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    }).select('+password +previousPasswords');

    if (!user) {
        return res.sendError('Password reset token is invalid or has expired', 400, 'AUTH_RESET_INVALID');
    }

    const strength = validatePasswordStrength(password, [user.name, user.email]);
    if (!strength.isValid) {
        return res.sendError(`Security Policy: ${strength.feedback}. ${strength.suggestion || ''}`, 400, 'SEC_PWD_WEAK');
    }

    const isReused = await user.isPasswordPreviouslyUsed(password);
    if (isReused) {
        return res.sendError('Security Policy: You cannot reuse a recent password.', 400, 'SEC_PWD_REUSE');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await Session.updateMany({ user: user._id, isValid: true }, { isValid: false, revokedAt: new Date() });
    await user.save();

    await logAuditEvent({ req, user: user._id, event: 'AUTH_PWD_RESET_SUCCESS', status: 'SUCCESS' });

    return res.sendSuccess({ message: 'Password has been reset successfully. You can now log in.' });
});
/**
 * @desc    Permanently delete account and all associated data (GDPR Art.17 — Right to Erasure)
 * @route   DELETE /api/v1/auth/account
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { password } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) {
        return res.sendError('User not found', 404, 'RES_NOT_FOUND');
    }

    if (user.password) {
        if (!password) {
            return res.sendError('Password confirmation is required to delete your account.', 400, 'AUTH_REAUTH_REQUIRED');
        }
        const valid = await user.matchPassword(password);
        if (!valid) {
            return res.sendError('Incorrect password. Account deletion cancelled.', 401, 'AUTH_INVALID_CREDENTIALS');
        }
    }

    const [Todo, StudySession, AuditLog, Message] = await Promise.all([
        import('../models/Todo.js').then(m => m.default),
        import('../models/StudySession.js').then(m => m.default),
        import('../models/AuditLog.js').then(m => m.default),
        import('../models/Message.js').then(m => m.default),
    ]);

    await Promise.all([
        Session.deleteMany({ user: userId }),
        Todo.deleteMany({ userId }),
        StudySession.deleteMany({ userId }),
        Message.deleteMany({ sender_id: userId }),
        AuditLog.deleteMany({ user: userId }),
    ]);

    await User.findByIdAndDelete(userId);
    res.clearCookie('refreshToken');

    await logAuditEvent({
        req,
        user: userId,
        event: 'AUTH_ACCOUNT_DELETE',
        status: 'SUCCESS',
        metadata: { method: user.password ? 'PASSWORD_CONFIRMED' : 'GOOGLE_ACCOUNT' }
    });

    logger.warn(`[GDPR] Account permanently deleted: ${userId}`);
    return res.sendSuccess({ message: 'Your account and all associated data have been permanently deleted.' });
});

/**
 * @desc    Export all personal data (GDPR Art.20 — Right to Data Portability)
 * @route   GET /api/v1/auth/data-export
 * @access  Private
 */
export const exportData = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [Todo, StudySession, AuditLog] = await Promise.all([
        import('../models/Todo.js').then(m => m.default),
        import('../models/StudySession.js').then(m => m.default),
        import('../models/AuditLog.js').then(m => m.default),
    ]);

    const [user, rawSessions, todos, studySessions, auditLogs] = await Promise.all([
        User.findById(userId).select('-password -previousPasswords -emailVerificationToken -resetPasswordToken -pendingEmailToken'),
        Session.find({ user: userId }).lean(),
        Todo.find({ userId }).lean(),
        StudySession.find({ userId }).lean(),
        AuditLog.find({ user: userId }).lean(),
    ]);

    const sessions = rawSessions.map(({ refreshTokenHash: _rth, previousTokenHashes: _pth, ...safe }) => safe);

    await logAuditEvent({ req, user: userId, event: 'AUTH_DATA_EXPORT', status: 'SUCCESS' });

    const exportPayload = {
        exportedAt: new Date().toISOString(),
        requestedBy: userId,
        data: {
            profile: user,
            sessions,
            todos,
            studySessions,
            auditLog: auditLogs,
        }
    };

    res.setHeader('Content-Disposition', `attachment; filename="crammerly-data-export-${userId}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(exportPayload, null, 2));
});

/**
 * @desc    Change authenticated user password
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password +previousPasswords +tokenVersion');
    
    if (!user) {
        return res.sendError('User not found', 404, 'RES_NOT_FOUND');
    }

    if (!currentPassword || !newPassword) {
        return res.sendError('Please provide current and new passwords', 400);
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'CURRENT_PASSWORD_INVALID' } });
        return res.sendError('Incorrect current password', 401, 'AUTH_INVALID');
    }

    const breachStatus = await checkBreachedPassword(newPassword);
    if (breachStatus.isBreached) {
        await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'DEFLECT_BREACHED_PASSWORD' } });
        return res.sendError('Security Alert: This password was found in a public data breach. Please choose a more secure password.', 400, 'SEC_PWD_BREACHED');
    }

    const strength = validatePasswordStrength(newPassword, [user.name, user.email]);
    if (!strength.isValid) {
        await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'WEAK_ENTROPY' } });
        return res.sendError(`Security Policy: ${strength.feedback}. ${strength.suggestion || ''}`, 400, 'SEC_PWD_WEAK');
    }

    const isPreviouslyUsed = await user.isPasswordPreviouslyUsed(newPassword);
    if (isPreviouslyUsed) {
         await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'PASSWORD_REUSED' } });
         return res.sendError('You cannot use a password you have used recently. Please choose a completely new password.', 400, 'SEC_PWD_REUSE');
    }

    user.password = newPassword;
    await user.save();

    await notifyPasswordChange(req, user);
    await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'SUCCESS' });

    return res.sendSuccess({ message: 'Password changed successfully' });
});
