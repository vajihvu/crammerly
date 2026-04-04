import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deactivateUser,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices,
    getOnboardingState,
    completeOnboarding,
    getUserSessions,
    revokeSession,
    verifyEmail,
    forgotPassword,
    resetPassword,
    googleLogin,
    deleteAccount,
    exportData,
    changePassword,
    generate2FA,
    enable2FA,
    disable2FA,
    verify2FA
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import { registerSchema, loginSchema, updateProfileSchema, resetPasswordSchema } from '../schemas/auth.schema.js';
import { csrfGuard } from '../middleware/csrf.js';
import { loginLimiter, refreshLimiter } from '../middleware/rateLimiter.js';


const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name: { type: string, example: "John Doe" }
 *               email: { type: string, example: "john@example.com" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       400:
 *         description: Validation failed or User exists
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/register', verifyCaptcha, validate(registerSchema), registerUser);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, example: "john@example.com" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginLimiter, validate(loginSchema), loginUser);

router.post('/google', loginLimiter, verifyCaptcha, googleLogin);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     responses:
 *       200:
 *         description: Token rotated
 *       401:
 *         description: Session expired
 */
router.post('/refresh', refreshLimiter, csrfGuard, refreshAccessToken);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', protect, csrfGuard, logoutUser);

router.post('/logout-all', protect, csrfGuard, logoutAllDevices);


router.route('/profile')
    /**
     * @openapi
     * /auth/profile:
     *   get:
     *     tags: [Authentication]
     *     summary: Get profile
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Profile data
     */
    .get(protect, getUserProfile)
    /**
     * @openapi
     * /auth/profile:
     *   put:
     *     tags: [Authentication]
     *     summary: Update profile
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Profile updated
     */
    .put(protect, validate(updateProfileSchema), updateUserProfile)

    /**
     * @openapi
     * /auth/profile:
     *   delete:
     *     tags: [Authentication]
     *     summary: Deactivate account
     *     security: [{ bearerAuth: [] }]
     *     responses:
     *       200:
     *         description: Account deactivated
     */
    .delete(protect, deactivateUser);

/**
 * @openapi
 * /auth/onboarding:
 *   get:
 *     tags: [Authentication]
 *     summary: Get onboarding progress and state
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current onboarding state
 */
router.get('/onboarding', protect, getOnboardingState);

/**
 * @openapi
 * /auth/onboarding/complete:
 *   post:
 *     tags: [Authentication]
 *     summary: Mark onboarding as finished
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Onboarding completed
 */
router.post('/onboarding/complete', protect, completeOnboarding);

/**
 * @openapi
 * /auth/sessions:
 *   get:
 *     tags: [Authentication]
 *     summary: List all active device sessions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of sessions
 */
router.get('/sessions', protect, getUserSessions);

/**
 * @openapi
 * /auth/sessions/{id}:
 *   delete:
 *     tags: [Authentication]
 *     summary: Revoke a specific session
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.delete('/sessions/:id', protect, revokeSession);

/**
 * @openapi
 * /auth/verify-email/{token}:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify user email
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email/:token', verifyEmail);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "user@example.com" }
 *     responses:
 *       200:
 *         description: Success message
 */
router.post('/forgot-password', loginLimiter, forgotPassword);

/**
 * @openapi
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password using token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, example: "NewStrongPassword123!" }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password/:token', csrfGuard, validate(resetPasswordSchema), resetPassword);

// Change Password
router.put('/password', protect, csrfGuard, changePassword);

// Two-Factor Authentication
router.post('/2fa/generate', protect, csrfGuard, generate2FA);
router.post('/2fa/enable', protect, csrfGuard, enable2FA);
router.post('/2fa/disable', protect, csrfGuard, disable2FA);
router.post('/verify-2fa', verify2FA);

// GDPR — Right to Erasure (Art.17)
router.delete('/account', protect, csrfGuard, deleteAccount);

// GDPR — Right to Data Portability (Art.20)
router.get('/data-export', protect, exportData);

export default router;
