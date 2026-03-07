import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

const API_ROOT = '/api/v1/auth';

describe('Auth Flow Integration Tests', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Correct-Horse-Battery-Staple-2026!',
    };

    describe(`POST ${API_ROOT}/register`, () => {
        it('should register a new user but NOT return a token (Verification Required)', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/register`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).not.toHaveProperty('token');
            expect(res.body.data.user.email).toBe(testUser.email);
            expect(res.headers['set-cookie']).toBeUndefined();

            const user = await User.findOne({ email: testUser.email });
            expect(user).toBeDefined();
            expect(user.isEmailVerified).toBe(false);
        });

        it('should fail if user already exists', async () => {
            await User.create(testUser);

            const res = await request(app)
                .post(`${API_ROOT}/register`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('RES_DUPLICATE');
        });
    });

    describe(`POST ${API_ROOT}/login`, () => {
        beforeEach(async () => {
            await User.deleteMany({});
            await request(app).post(`${API_ROOT}/register`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send(testUser);
            // MANUALLY VERIFY FOR TESTING LOGIN
            await User.updateOne({ email: testUser.email }, { isEmailVerified: true });
        });

        it('should login and return a new access token for verified users', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/login`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should fail if email is not verified', async () => {
            await User.updateOne({ email: testUser.email }, { isEmailVerified: false });

            const res = await request(app)
                .post(`${API_ROOT}/login`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('AUTH_UNVERIFIED');
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/login`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('AUTH_INVALID');
        });
    });

    describe(`POST ${API_ROOT}/refresh`, () => {
        let refreshToken;

        beforeEach(async () => {
            await User.deleteMany({});
            await request(app).post(`${API_ROOT}/register`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send(testUser);
            await User.updateOne({ email: testUser.email }, { isEmailVerified: true });

            // Login to get the cookie
            const res = await request(app).post(`${API_ROOT}/login`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            const cookies = res.headers['set-cookie'];
            if (!cookies) {
                console.error('Login Failure in Test Setup:', {
                    status: res.status,
                    body: res.body,
                    headers: res.headers
                });
                throw new Error('No cookies in response after login');
            }
            refreshToken = cookies[0].split(';')[0].split('=')[1];
        });

        it('should rotate the refresh token and return new access token (requires CSRF)', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/refresh`)
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .set('X-CSRF-Token', 'super-secret-proof-of-intent');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.headers['set-cookie']).toBeDefined();

            const sessions = await Session.find({ isValid: true });
            expect(sessions.length).toBe(1);
        });

        it('should fail if no CSRF token provided', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/refresh`)
                .set('X-Test-CSRF-Enforce', 'true')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('SEC_CSRF_MISSING');
        });

        it('should fail if no refresh token provided', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/refresh`)
                .set('X-CSRF-Token', 'super-secret-proof-of-intent');

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('AUTH_EXPIRED');
        });
    });

    describe(`POST ${API_ROOT}/logout-all`, () => {
        let accessToken;

        beforeEach(async () => {
            await User.deleteMany({});
            await Session.deleteMany({});
            await request(app).post(`${API_ROOT}/register`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send(testUser);
            await User.updateOne({ email: testUser.email }, { isEmailVerified: true });

            const res = await request(app).post(`${API_ROOT}/login`)
                .set('X-Requested-With', 'XMLHttpRequest')
                .send({ email: testUser.email, password: testUser.password });

            accessToken = res.body.data?.token;
        });

        it('should block /logout-all without a CSRF header (CSRF enforcement)', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/logout-all`)
                .set('Authorization', `Bearer ${accessToken}`)
                .set('X-Test-CSRF-Enforce', 'true'); // Force CSRF check in test env

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('SEC_CSRF_MISSING');
        });

        it('should succeed on /logout-all with a valid CSRF header', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/logout-all`)
                .set('Authorization', `Bearer ${accessToken}`)
                .set('X-CSRF-Token', 'proof-of-intent');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
