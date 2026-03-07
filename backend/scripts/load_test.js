/**
 * Crammerly Load Test — k6
 *
 * Run against staging BEFORE going live:
 *   npx k6 run --vus 50 --duration 60s -e BASE_URL=https://staging.crammerly.io backend/scripts/load_test.js
 *
 * Record p50/p95/p99 as your performance baseline.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const loginDuration = new Trend('login_duration_ms');

/* global __ENV */
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const HEADERS = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
};

export const options = {
    stages: [
        { duration: '15s', target: 20 },  // Ramp up
        { duration: '30s', target: 50 },  // Hold at peak
        { duration: '15s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
        error_rate: ['rate<0.02'],         // Error rate under 2%
    },
};

export default function () {
    group('Health Check', () => {
        const res = http.get(`${BASE_URL}/health`);
        check(res, { 'health 200': (r) => r.status === 200 });
        errorRate.add(res.status >= 500);
    });

    group('Auth — Login (rate-limited endpoint)', () => {
        const start = Date.now();
        const res = http.post(
            `${BASE_URL}/api/v1/auth/login`,
            JSON.stringify({ email: 'loadtest@crammerly.io', password: 'LoadTest123!@#' }),
            { headers: HEADERS }
        );
        loginDuration.add(Date.now() - start);

        // Rate limiter will fire 429s for this — that's expected and correct
        check(res, { 'login no 5xx': (r) => r.status < 500 });
        errorRate.add(res.status >= 500);
    });

    group('Rooms List (cached endpoint)', () => {
        // Provide a fake Auth header — expect 401, not 5xx
        const res = http.get(`${BASE_URL}/api/v1/rooms`, {
            headers: { ...HEADERS, 'Authorization': 'Bearer fake-token' }
        });
        check(res, { 'rooms no 5xx': (r) => r.status < 500 });
        errorRate.add(res.status >= 500);
    });

    sleep(1);
}
