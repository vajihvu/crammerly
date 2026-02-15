import request from 'supertest';
import app from '../app.js';

describe('Simple Boot Test', () => {
    it('should respond to /health', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });

    it('should bypass CSRF in test mode', async () => {
        const res = await request(app).post('/health');
        expect(res.status).not.toBe(403);
    });
});
