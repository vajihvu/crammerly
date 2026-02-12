import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deactivateUser,
    refreshAccessToken,
    logoutUser,
    getOnboardingState,
    completeOnboarding
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { verifyCaptcha } from '../middleware/captcha.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

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
router.post('/login', verifyCaptcha, validate(loginSchema), loginUser);

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
router.post('/refresh', refreshAccessToken);

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
router.post('/logout', logoutUser);

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
    .put(protect, updateUserProfile)
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

export default router;
