import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

describe('End-to-End User Flows', () => {

    const testUser = {
        name: 'E2E User',
        email: 'e2e@example.com',
        password: 'Correct-Horse-Battery-Staple-2026!',
    };

    beforeEach(async () => {
        await User.deleteMany({});
        await Session.deleteMany({});
    }, 30000);

    it('should complete a full Happy Path: Register -> Verify -> Login -> Action -> Logout', async () => {
        // 1. REGISTER
        const regRes = await request(app)
            .post('/api/v1/auth/register')
            .send(testUser);

        expect(regRes.status).toBe(201);
        expect(regRes.body.data.message).toContain('verify your account');

        // 2. VERIFY (Simulate email verification in DB)
        await User.updateOne({ email: testUser.email }, { isEmailVerified: true });

        // 3. LOGIN
        const loginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(loginRes.status).toBe(200);
        const accessToken = loginRes.body.data.token;
        const refreshToken = loginRes.header['set-cookie'][0].split(';')[0].split('=')[1];

        // 4. ACTION (Protected Route - Get Profile)
        const profileRes = await request(app)
            .get('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(profileRes.status).toBe(200);

        // 5. LOGOUT
        const logoutRes = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', [`refreshToken=${refreshToken}`]);

        expect(logoutRes.status).toBe(200);

        // 6. VERIFY SESSIONS
        const sessions = await Session.find({ user: loginRes.body.data.user.id, isValid: true });
        expect(sessions.length).toBe(0);
    }, 30000);

    it('should handle Password Change flow correctly (Critical Path)', async () => {
        await request(app).post('/api/v1/auth/register').send(testUser);
        await User.updateOne({ email: testUser.email }, { isEmailVerified: true });

        const loginRes = await request(app).post('/api/v1/auth/login').send({
            email: testUser.email,
            password: testUser.password
        });

        expect(loginRes.status).toBe(200);
        const accessToken = loginRes.body.data.token;

        const newPassword = 'Better-Horse-Battery-Staple-2027!';
        const updateRes = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ password: newPassword });

        expect(updateRes.status).toBe(200);

        // Verify: Old password fails
        const badLoginRes = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: testUser.email, password: testUser.password });
        expect(badLoginRes.status).toBe(401);

        // Verify: Reuse Prevention
        const reuseUpdateRes = await request(app)
            .put('/api/v1/auth/profile')
            .set('Authorization', `Bearer ${updateRes.body.data.token}`)
            .send({ password: testUser.password });

        expect(reuseUpdateRes.status).toBe(400);
        expect(reuseUpdateRes.body.error.code).toBe('SEC_PWD_REUSE');
    }, 30000);

    it('should block breached passwords (HIBP-style Policy)', async () => {
        const breachedPassword = 'Strong-BREACHED-Passphrase-2026!'; // Passes Zod/zxcvbn, fails Breach Check due to simulation
        const regRes = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Breach User',
                email: 'breach@example.com',
                password: breachedPassword
            });

        expect(regRes.status).toBe(400);
        expect(regRes.body.error.code).toBe('SEC_PWD_BREACHED');
    }, 30000);
});
