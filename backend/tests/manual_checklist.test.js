import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

const API_V1 = '/api/v1';

describe('🚀 PRODUCTION READINESS: Auth Checklist Verification', () => {

    beforeAll(async () => {
        await User.deleteMany({});
        await Session.deleteMany({});
    });

    const getNewUser = (prefix) => ({
        name: `${prefix} User`,
        email: `${prefix.toLowerCase()}@crammerly.io`,
        password: 'Rapidly-Rotating-Nebula-2026!',
    });

    const check = (res, name) => {
        if (res.status >= 400) {
            console.log(`\n❌ FAILED [${name}]: ${res.status} ${JSON.stringify(res.body)}`);
        }
    };

    it('✅ Requirement: Register & Email Verify', async () => {
        const user = getNewUser('Reg');
        const res = await request(app).post(`${API_V1}/auth/register`).send(user);
        check(res, 'Register');
        expect(res.status).toBe(201);
        const token = res.body.data.verificationToken;

        const verify = await request(app).get(`${API_V1}/auth/verify-email/${token}`);
        check(verify, 'Verify');
        expect(verify.status).toBe(200);
    });

    it('✅ Requirement: Login & Tokens', async () => {
        const user = getNewUser('Login');
        await request(app).post(`${API_V1}/auth/register`).send(user);
        await User.updateOne({ email: user.email }, { isEmailVerified: true });

        const res = await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: user.password });
        check(res, 'Login');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('token');
    });

    it('✅ Requirement: Captcha Trigger & Lockout', async () => {
        const user = getNewUser('Lock');
        await request(app).post(`${API_V1}/auth/register`).send(user);
        await User.updateOne({ email: user.email }, { isEmailVerified: true });

        // failures for Captcha hint
        for (let i = 0; i < 3; i++) await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: 'X' });
        const captchaRes = await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: 'X' });

        // Property is on body.meta, not body.error.meta
        expect(captchaRes.body.meta).toHaveProperty('requiresCaptcha', true);

        // failures for Lockout
        await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: 'X' });
        const lockoutRes = await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: 'X' });
        expect(lockoutRes.status).toBe(423);
    });

    it('✅ Requirement: Refresh Rotation & Token Reuse Detection', async () => {
        const user = getNewUser('Rotate');
        await request(app).post(`${API_V1}/auth/register`).send(user);
        await User.updateOne({ email: user.email }, { isEmailVerified: true });

        const login = await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: user.password });
        const refreshToken = login.headers['set-cookie'][0].split(';')[0].split('=')[1];

        const rotate = await request(app).post(`${API_V1}/auth/refresh`).set('Cookie', [`refreshToken=${refreshToken}`]);
        check(rotate, 'Rotate');
        expect(rotate.status).toBe(200);

        const reuse = await request(app).post(`${API_V1}/auth/refresh`).set('Cookie', [`refreshToken=${refreshToken}`]);
        check(reuse, 'Reuse');
        expect(reuse.status).toBe(401);
    });

    it('✅ Requirement: Logout All Devices', async () => {
        const user = getNewUser('LogoutAll');
        await request(app).post(`${API_V1}/auth/register`).send(user);
        await User.updateOne({ email: user.email }, { isEmailVerified: true });

        const l1 = await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: user.password });
        const res = await request(app).post(`${API_V1}/auth/logout-all`).set('Authorization', `Bearer ${l1.body.data.token}`);
        check(res, 'LogoutAll');
        expect(res.status).toBe(200);
    });

    it('✅ Requirement: Password Security', async () => {
        const user = getNewUser('Security');
        await request(app).post(`${API_V1}/auth/register`).send(user);
        await User.updateOne({ email: user.email }, { isEmailVerified: true });

        const login = await request(app).post(`${API_V1}/auth/login`).send({ email: user.email, password: user.password });
        const token = login.body.data.token;

        const nextPwd = 'Perfect-Horse-Battery-Staple-2027!';
        const change = await request(app).put(`${API_V1}/auth/profile`).set('Authorization', `Bearer ${token}`).send({ password: nextPwd });
        check(change, 'ChangePwd');
        expect(change.status).toBe(200);

        const oldCheck = await request(app).get(`${API_V1}/auth/profile`).set('Authorization', `Bearer ${token}`);
        expect(oldCheck.status).toBe(401);
    });

    it('✅ Requirement: Reset Password Flow', async () => {
        const user = getNewUser('Reset');
        await request(app).post(`${API_V1}/auth/register`).send(user);

        const forgot = await request(app).post(`${API_V1}/auth/forgot-password`).send({ email: user.email });
        check(forgot, 'Forgot');
        const resetToken = forgot.body.data.resetToken;

        const reset = await request(app).post(`${API_V1}/auth/reset-password/${resetToken}`).send({ password: 'Cloudy-Weather-With-A-Chance-Of-Meatballs-2026!' });
        check(reset, 'Reset');
        expect(reset.status).toBe(200);
    });
});
