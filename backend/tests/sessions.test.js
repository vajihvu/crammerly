import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

const API_V1 = '/api/v1';

describe('Session management Integration Tests', () => {
    const testUser = {
        name: 'Test User',
        email: 'session@example.com',
        password: 'Password123!',
    };

    let token;
    let userId;

    beforeEach(async () => {
        await User.deleteMany({});
        await Session.deleteMany({});
        const res = await request(app).post(`${API_V1}/auth/register`).send(testUser);
        if (res.status !== 201) {
            throw new Error(`Auth failed: ${JSON.stringify(res.body)}`);
        }
        token = res.body.data.token;
        userId = res.body.data._id;
    });

    describe(`GET ${API_V1}/sessions`, () => {
        it('should return all active sessions for the user', async () => {
            // Create another session (simulate second login)
            await request(app).post(`${API_V1}/auth/login`).send({
                email: testUser.email,
                password: testUser.password
            });

            const res = await request(app)
                .get(`${API_V1}/sessions`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
            expect(res.body.data[0]).toHaveProperty('deviceName');
            expect(res.body.data[0]).not.toHaveProperty('refreshTokenHash');
            expect(res.body).toHaveProperty('meta');
        });

        it('should fail if not authenticated', async () => {
            const res = await request(app).get(`${API_V1}/sessions`);
            expect(res.status).toBe(401);
        });
    });

    describe(`DELETE ${API_V1}/sessions/:id`, () => {
        it('should revoke a session', async () => {
            const sessionsRes = await request(app)
                .get(`${API_V1}/sessions`)
                .set('Authorization', `Bearer ${token}`);

            const sessionId = sessionsRes.body.data[0].id;

            const res = await request(app)
                .delete(`${API_V1}/sessions/${sessionId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const session = await Session.findById(sessionId);
            expect(session.isValid).toBe(false);
            expect(session.revokedAt).toBeDefined();
        });

        it('should fail if session does not belong to user', async () => {
            const res = await request(app)
                .delete(`${API_V1}/sessions/65bc48e3e4f3a539c8000000`) // Non-existent ID
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('RES_NOT_FOUND');
        });
    });
});
