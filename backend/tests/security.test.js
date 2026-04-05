import request from 'supertest';
import app from '../app.js';

const API_V1 = '/api/v1';

describe('Security Middleware Integration Tests', () => {
    describe('Depth Limit Middleware', () => {
        it('should allow shallow objects', async () => {
            const res = await request(app)
                .post(`${API_V1}/auth/login`)
                .send({ email: 'test@test.com', password: '123' });

            expect(res.body.error?.code).not.toBe('VAL_MALFORMED_JSON');
        });

        it('should block deeply nested objects (DoS protection)', async () => {
            const deepObject = {
                a: {
                    b: {
                        c: {
                            d: {
                                e: {
                                    f: 'too deep'
                                }
                            }
                        }
                    }
                }
            };

            const res = await request(app)
                .post(`${API_V1}/auth/login`)
                .send(deepObject);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('VAL_MALFORMED_JSON');
            expect(res.body.error.message).toContain('exceeds limit');
        });
    });

    describe('Payload Size Limit', () => {
        it('should block payloads over 5mb', async () => {
            const largeString = 'a'.repeat(6 * 1024 * 1024); // 6mb
            const res = await request(app)
                .post(`${API_V1}/auth/login`)
                .send({ data: largeString });

            expect(res.status).toBe(413); // Payload Too Large
        });
    });
});
