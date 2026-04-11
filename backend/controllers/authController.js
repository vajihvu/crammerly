import User from '../models/User.js';
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
import { OAuth2Client } from 'google-auth-library';

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
export const registerUser = async (req, res, next) => {
    let { name, email, password } = req.body;
    email = email.toLowerCase().trim();


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

        // 1. Policy: Entropy & Pattern Check
        const strength = validatePasswordStrength(password, [name, email]);
        if (!strength.isValid) {
            await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'WEAK_ENTROPY' } });
            const error = new Error(`Security Policy: ${strength.feedback}. ${strength.suggestion || ''}`);
            error.statusCode = 400;
            error.code = 'SEC_PWD_WEAK';
            return next(error);
        }

        // 2. Policy: Email Verification Setup
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await User.create({
            name,
            email,
            password,
            isEmailVerified: false,
            emailVerificationToken: hashToken(verificationToken),
            emailVerificationExpires: verificationExpires
        });

        await logAuditEvent({ req, user: user._id, event: 'AUTH_REGISTER', status: 'SUCCESS', metadata: { method: 'EMAIL' } });

        // 3. Dispatch Verification Email — fire-and-forget so registration responds immediately
        // If email fails, user can request a resend from the login page
        sendVerificationEmail(req, user, verificationToken)
            .catch(emailErr => logger.error(`Failed to send verification email to ${user.email}: ${emailErr.message}`));

        return res.sendSuccess({
            message: 'Registration successful! Please check your email and verify your account to log in.',
            user: formatUserPayload(user),
            // Only expose token in dev for simulator/testing ease
            ...(config.isProduction ? {} : { verificationToken })
        }, 201);
    } catch (error) {
        // Handle E11000 duplicate key error (Race condition safeguard)
        if (error.code === 11000) {
            await logAuditEvent({ req, event: 'AUTH_REGISTER', status: 'FAILURE', metadata: { email, reason: 'RACE_CONDITION_DUPLICATE' } });
            const duplicateError = new Error('User with this email or tag already exists');
            duplicateError.statusCode = 400;
            duplicateError.code = 'RES_DUPLICATE';
            return next(duplicateError);
        }
        next(error);
    }

};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/v1/auth/login
 */
export const loginUser = async (req, res, next) => {
    let { email, password } = req.body;
    email = email.toLowerCase().trim();


    try {
        const user = await User.findOne({ email }).select('+password +tokenVersion');

        if (!user) {
            await logAuditEvent({ req, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { email, reason: 'NOT_FOUND' } });
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            error.code = 'AUTH_INVALID';
            throw error;
        }

        // 0. Verify Email Status
        if (!user.isEmailVerified) {
            await logAuditEvent({ req, user: user._id, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { reason: 'EMAIL_UNVERIFIED' } });
            const error = new Error('Your email is not verified. Please check your inbox for the activation link.');
            error.statusCode = 403;
            error.code = 'AUTH_UNVERIFIED';
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

export const googleLogin = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            const error = new Error('Google token is missing');
            error.statusCode = 400;
            return next(error);
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
            // An attacker could create a Google account with the victim's email
            // and silently gain access. Require the user to link via profile settings.
            await logAuditEvent({ req, event: 'AUTH_LOGIN', status: 'FAILURE', metadata: { email, reason: 'GOOGLE_LINK_DENIED' } });
            const error = new Error('An account with this email already exists. Please log in with your password first, then link Google from your profile settings.');
            error.statusCode = 409;
            error.code = 'AUTH_ACCOUNT_CONFLICT';
            return next(error);
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
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 */
export const refreshAccessToken = async (req, res, next) => {
    const oldRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
    if (!oldRefreshToken) {
        const error = new Error('Refresh token missing');
        error.statusCode = 401;
        error.code = 'AUTH_EXPIRED';
        return next(error);
    }

    try {
        const newRefreshToken = await rotateRefreshToken(
            req,
            oldRefreshToken,
            req.headers['user-agent'],
            req.ip
        );

        // rotateRefreshToken ensures session is valid and not reused.
        // We fetch the session again or just the user.
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
        logger.error(`Refresh Token Error: ${error.message}`);
        
        // Only clear cookie for definitive "dead" token errors. 
        // Do NOT clear for rotation races (401 with AUTH_ROTATION_RACE) or rate limits (429).
        // If it's a race, the client already has a newer valid cookie; clearing it now would kill the session.
        const isFatal = error.statusCode === 401 && error.code !== 'AUTH_ROTATION_RACE';
        if (isFatal) {
            res.clearCookie('refreshToken', COOKIE_OPTIONS);
        }
        
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

export const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('+password +previousPasswords +tokenVersion');
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.name = req.body.name || user.name;

        // Email change requires re-verification — don't apply directly
        if (req.body.email && req.body.email.toLowerCase().trim() !== user.email) {
            const newEmail = req.body.email.toLowerCase().trim();
            // Check if new email is already taken
            const emailExists = await User.findOne({ email: newEmail });
            if (emailExists) {
                const error = new Error('This email is already in use by another account.');
                error.statusCode = 400;
                error.code = 'RES_DUPLICATE';
                throw error;
            }
            const verificationToken = generateVerificationToken();
            user.pendingEmail = newEmail;
            user.pendingEmailToken = hashToken(verificationToken);
            user.pendingEmailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            // Send verification to the NEW email address
            await sendVerificationEmail(req, { ...user.toObject(), email: newEmail }, verificationToken);
            // Note: user.email stays unchanged until the new email is verified
        }

        // Profile fields
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        if (req.body.institution !== undefined) user.institution = req.body.institution;
        if (req.body.course !== undefined) user.course = req.body.course;
        if (req.body.username !== undefined) user.username = req.body.username;
        if (req.body.interests !== undefined) user.interests = req.body.interests;
        if (req.body.skills !== undefined) user.skills = req.body.skills;
        if (req.body.socialLinks !== undefined) user.socialLinks = req.body.socialLinks;
        if (req.body.avatarUrl !== undefined) user.avatar = req.body.avatarUrl;

        // Settings persistence
        if (req.body.settings !== undefined) {
            if (!user.settings) user.settings = {};
            if (req.body.settings.language !== undefined) {
                user.settings.language = req.body.settings.language;
            }
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

            // 3. Policy: Entropy & Pattern Check
            const strength = validatePasswordStrength(newPassword, [user.name, user.email]);
            if (!strength.isValid) {
                const error = new Error(`Security Policy: ${strength.feedback}. ${strength.suggestion || ''}`);
                error.statusCode = 400;
                error.code = 'SEC_PWD_WEAK';
                throw error;
            }

            // 4. Set new password (model pre-save handles history & versioning automatically)
            user.password = newPassword;

            // 4. Invalidate EVERYTHING (Global Revocation)
            // tokenVersion is handled in pre-save, but we ensure sessions are explicitly revoked here
            await Session.updateMany(
                { user: user._id, isValid: true },
                {
                    isValid: false,
                    revokedAt: new Date()
                }
            );

            // 5. Notify user
            await notifyPasswordChange(req, user);
        }


        const updatedUser = await user.save();


        // If password changed, issue new refresh token & session
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
    } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
            const duplicateError = new Error('This username already exists');
            duplicateError.statusCode = 400;
            duplicateError.code = 'RES_DUPLICATE';
            return next(duplicateError);
        }
        next(error);
    }
};

export const deactivateUser = async (req, res, next) => {
    const { password } = req.body;

    try {
        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Skip password check for Google-only accounts (no local password)
        if (user.password) {
            if (!password || !(await user.matchPassword(password))) {
                const error = new Error('Incorrect password. Account deactivation requires confirmation.');
                error.statusCode = 401;
                error.code = 'AUTH_INVALID';
                throw error;
            }
        }

        user.isActive = false;
        await user.save();
        await Session.updateMany(
            { user: user._id, isValid: true },
            { isValid: false, revokedAt: new Date() }
        ); // Revoke all sessions

        await logAuditEvent({ req, user: user._id, event: 'USER_DEACTIVATE', status: 'SUCCESS' });
        res.clearCookie('refreshToken', COOKIE_OPTIONS);
        return res.sendSuccess({ message: 'Account deactivated successfully' });

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
export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const hashedToken = hashToken(token);

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        }).select('+password +previousPasswords');

        if (!user) {
            // Check if this is a re-click of an already-verified link
            // (token was consumed on first successful verification)
            await User.findOne({
                isEmailVerified: true,
                emailVerificationToken: { $exists: false }
            }).select('email isEmailVerified');

            // If we can't determine it's a re-verification, show a friendlier error
            return res.sendSuccess({
                message: 'This verification link has already been used or has expired. If you already verified, you can log in now.',
                alreadyVerified: true
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        await logAuditEvent({
            req,
            user: user._id,
            event: 'AUTH_VERIFY_EMAIL',
            status: 'SUCCESS'
        });

        return res.sendSuccess({ message: 'Email verified successfully! You can now log in.' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Request password reset token
 * @route   POST /api/v1/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
    try {
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

        await logAuditEvent({
            req,
            user: user._id,
            event: 'AUTH_PWD_RESET_REQUEST',
            status: 'SUCCESS'
        });

        // 3. Dispatch Reset Loop
        await sendPasswordResetEmail(req, user, resetToken);

        return res.sendSuccess({
            message: 'If an account exists with that email, a password reset link has been sent to your inbox.',
            // Only expose token in dev for simulator/testing ease
            ...(config.isProduction ? {} : { resetToken })
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/v1/auth/reset-password/:token
 */
export const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const hashedToken = hashToken(token);

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+password +previousPasswords');

        if (!user) {
            const error = new Error('Password reset token is invalid or has expired');
            error.statusCode = 400;
            error.code = 'AUTH_RESET_INVALID';
            throw error;
        }

        // 1. Policy: Entropy & Pattern Check
        const strength = validatePasswordStrength(password, [user.name, user.email]);
        if (!strength.isValid) {
            const error = new Error(`Security Policy: ${strength.feedback}. ${strength.suggestion || ''}`);
            error.statusCode = 400;
            error.code = 'SEC_PWD_WEAK';
            throw error;
        }

        // 2. Policy: Reuse Prevention
        const isReused = await user.isPasswordPreviouslyUsed(password);
        if (isReused) {
            const error = new Error('Security Policy: You cannot reuse a recent password.');
            error.statusCode = 400;
            error.code = 'SEC_PWD_REUSE';
            throw error;
        }

        // 3. Update password & clear reset fields
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // 4. Invalidate EVERYTHING (Global Revocation)
        // Resetting password must cryptographically kill all existing access tokens via version rotation
        // and explicitly mark all refresh sessions as invalid.
        await Session.updateMany(
            { user: user._id, isValid: true },
            {
                isValid: false,
                revokedAt: new Date()
            }
        );

        await user.save();

        await logAuditEvent({
            req,
            user: user._id,
            event: 'AUTH_PWD_RESET_SUCCESS',
            status: 'SUCCESS'
        });

        return res.sendSuccess({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Permanently delete account and all associated data (GDPR Art.17 — Right to Erasure)
 * @route   DELETE /api/v1/auth/account
 * @access  Private
 */
export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { password } = req.body;

        // Re-authenticate — require password confirmation to prevent CSRF-driven account wipes
        const user = await User.findById(userId).select('+password');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            return next(error);
        }

        // Skip password check for Google-only accounts (no local password)
        if (user.password) {
            if (!password) {
                const error = new Error('Password confirmation is required to delete your account.');
                error.statusCode = 400;
                error.code = 'AUTH_REAUTH_REQUIRED';
                return next(error);
            }
            const valid = await user.matchPassword(password);
            if (!valid) {
                const error = new Error('Incorrect password. Account deletion cancelled.');
                error.statusCode = 401;
                error.code = 'AUTH_INVALID_CREDENTIALS';
                return next(error);
            }
        }

        // Import data models dynamically to avoid circular deps at module load
        const [Todo, StudySession, AuditLog, Message] = await Promise.all([
            import('../models/Todo.js').then(m => m.default),
            import('../models/StudySession.js').then(m => m.default),
            import('../models/AuditLog.js').then(m => m.default),
            import('../models/Message.js').then(m => m.default),
        ]);

        // Cascade delete all user data
        await Promise.all([
            Session.deleteMany({ user: userId }),
            Todo.deleteMany({ userId }),
            StudySession.deleteMany({ userId }),
            Message.deleteMany({ sender_id: userId }),
            AuditLog.deleteMany({ user: userId }),
        ]);

        await User.findByIdAndDelete(userId);

        // Clear session cookie
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
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Export all personal data (GDPR Art.20 — Right to Data Portability)
 * @route   GET /api/v1/auth/data-export
 * @access  Private
 */
export const exportData = async (req, res, next) => {
    try {
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

        // Strip sensitive token hashes from session data before export
        const sessions = rawSessions.map(({ refreshTokenHash: _rth, previousTokenHashes: _pth, ...safe }) => safe);

        await logAuditEvent({
            req,
            user: userId,
            event: 'AUTH_DATA_EXPORT',
            status: 'SUCCESS'
        });

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
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Change authenticated user password
 * @route   PUT /api/v1/auth/password
 * @access  Private
 */
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id).select('+password +previousPasswords +tokenVersion');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'CURRENT_PASSWORD_INVALID' } });
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        const breachStatus = await checkBreachedPassword(newPassword);
        if (breachStatus.isBreached) {
            await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'DEFLECT_BREACHED_PASSWORD' } });
            return res.status(400).json({ success: false, message: 'Security Alert: This password was found in a public data breach. Please choose a more secure password.' });
        }

        const strength = validatePasswordStrength(newPassword, [user.name, user.email]);
        if (!strength.isValid) {
            await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'WEAK_ENTROPY' } });
            return res.status(400).json({ success: false, message: `Security Policy: ${strength.feedback}. ${strength.suggestion || ''}` });
        }

        const isPreviouslyUsed = await user.isPasswordPreviouslyUsed(newPassword);
        if (isPreviouslyUsed) {
             await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'FAILURE', metadata: { reason: 'PASSWORD_REUSED' } });
             return res.status(400).json({ success: false, message: 'You cannot use a password you have used recently. Please choose a completely new password.' });
        }

        user.password = newPassword;
        await user.save();

        await notifyPasswordChange(req, user);
        await logAuditEvent({ req, event: 'AUTH_PASSWORD_CHANGE', status: 'SUCCESS' });

        res.sendSuccess({ message: 'Password changed successfully' });
    } catch (error) {
        next(error);
    }
};
