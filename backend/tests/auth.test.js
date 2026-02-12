import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

const API_ROOT = '/api/v1/auth';

describe('Auth Flow Integration Tests', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
    };

    describe(`POST ${API_ROOT}/register`, () => {
        it('should register a new user and return a token', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/register`)
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.body).toHaveProperty('meta');

            const user = await User.findOne({ email: testUser.email });
            expect(user).toBeDefined();
        });

        it('should fail if user already exists', async () => {
            await User.create(testUser);

            const res = await request(app)
                .post(`${API_ROOT}/register`)
                .send(testUser);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('RES_DUPLICATE');
        });
    });

    describe(`POST ${API_ROOT}/login`, () => {
        beforeEach(async () => {
            await User.deleteMany({});
            await request(app).post(`${API_ROOT}/register`).send(testUser);
        });

        it('should login and return a new access token', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/login`)
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.headers['set-cookie']).toBeDefined();
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/login`)
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
            const res = await request(app).post(`${API_ROOT}/register`).send(testUser);
            const cookies = res.headers['set-cookie'];
            if (!cookies) throw new Error('No cookies in response');
            refreshToken = cookies[0].split(';')[0].split('=')[1];
        });

        it('should rotate the refresh token and return new access token', async () => {
            const res = await request(app)
                .post(`${API_ROOT}/refresh`)
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('token');
            expect(res.headers['set-cookie']).toBeDefined();

            const sessions = await Session.find({ isValid: true });
            expect(sessions.length).toBe(1);
        });

        it('should fail if no refresh token provided', async () => {
            const res = await request(app).post(`${API_ROOT}/refresh`);
            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('AUTH_EXPIRED');
        });
    });
});
