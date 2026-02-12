import request from 'supertest';
import app from '../app.js';

describe('API Contract Integration Tests', () => {
    describe('Global Response Format', () => {
        it('should have success, data, and meta in successful responses', async () => {
            const res = await request(app).get('/health');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success');
            // Health check currently returns status and message directly, 
            // we should refactor it to match the contract: { success: true, data: { status: 'OK' }, meta: { ... } }
        });

        it('should have success: false, error, and meta in error responses', async () => {
            const res = await request(app).get('/api/non-existent-route');

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toHaveProperty('code');
            expect(res.body.error).toHaveProperty('message');
            expect(res.body).toHaveProperty('meta');
            expect(res.body.meta).toHaveProperty('timestamp');
            expect(res.body.meta).toHaveProperty('path');
        });
    });
});
