import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';

describe('Account Lockout Integration Tests', () => {

    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should lock account after 5 failed attempts', async () => {
        const email = 'lockout@test.com';
        const password = 'Correct-Horse-Battery-Staple-2026!';

        // Create user
        await User.create({ name: 'Lockout User', email, password, isEmailVerified: true });

        // 5 failed attempts
        for (let i = 0; i < 5; i++) {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ email, password: 'wrongpassword' });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('AUTH_INVALID');
        }

        // 6th attempt should be LOCKED
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email, password }); // Correct password but locked

        expect(res.status).toBe(423);
        expect(res.body.error.code).toBe('AUTH_LOCKED');
        expect(res.body.error.message).toContain('locked');
    }, 30000);

    it('should reset attempts after high failures but before lockout on successful login', async () => {
        const email = 'reset@test.com';
        const password = 'Correct-Horse-Battery-Staple-2026!';
        await User.create({ name: 'Reset User', email, password, isEmailVerified: true });

        // 3 failed attempts
        for (let i = 0; i < 3; i++) {
            await request(app)
                .post('/api/v1/auth/login')
                .send({ email, password: 'wrongpassword' });
        }

        // Successful login
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email, password });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);


        // Verify in DB that attempts are 0
        const user = await User.findOne({ email });
        expect(user.loginAttempts).toBe(0);
    }, 30000);
});
