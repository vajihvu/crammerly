
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    validateStatus: () => true
});

const TEST_USER = {
    email: `reuse_test_${Date.now()}@example.com`,
    password: 'TR-vx-99-Alpha-!@#',
    name: 'Reuse Tester'
};

async function runReuseTest() {
    console.log('🚀 Starting Refresh Token Reuse Detection Test...');

    // 1. Setup
    console.log('\n1. Registering and verifying user...');
    const reg = await client.post('/auth/register', TEST_USER);
    if (reg.data.data?.verificationToken) {
        await client.get(`/auth/verify-email/${reg.data.data.verificationToken}`);
    }
    console.log('✅ User ready.');

    // 2. Initial Login
    console.log('\n2. Logging in to get initial refresh token...');
    const loginRes = await client.post('/auth/login', TEST_USER);
    let cookie = (loginRes.headers['set-cookie'] || []).find(c => c.startsWith('refreshToken='));

    if (!cookie) {
        console.error('❌ Login failed: No refresh token cookie.');
        process.exit(1);
    }

    const initialCookie = cookie.split(';')[0];
    console.log('✅ Initial refresh token received.');

    // 3. First Rotation (Legitimate)
    console.log('\n3. Performing legitimate refresh (Rotation 1)...');
    const refresh1Res = await client.post('/auth/refresh', {}, {
        headers: { Cookie: initialCookie }
    });

    if (refresh1Res.status !== 200) {
        console.error('❌ First refresh failed:', refresh1Res.status, refresh1Res.data);
        process.exit(1);
    }

    let rotatedCookie = (refresh1Res.headers['set-cookie'] || []).find(c => c.startsWith('refreshToken='));
    const secondCookie = rotatedCookie.split(';')[0];
    console.log('✅ First rotation successful. New token received.');

    // 4. Reuse Detection Test
    console.log('\n4. Attempting to REUSE the initial token (REUSE ATTACK)...');
    const reuseRes = await client.post('/auth/refresh', {}, {
        headers: { Cookie: initialCookie }
    });

    console.log(`✅ Reuse Response Status: ${reuseRes.status} (Expected 401/403)`);
    console.log(`✅ Reuse Error Message: ${JSON.stringify(reuseRes.data.error || reuseRes.data.message)}`);

    if (reuseRes.status === 401 || reuseRes.status === 403) {
        console.log('✅ REUSE BLOCKED: The server detected reuse of the old token.');

        // 5. Verify Session Family Revocation
        console.log('\n5. Verifying session family revocation (New token should now be invalid)...');
        const verifyRes = await client.post('/auth/refresh', {}, {
            headers: { Cookie: secondCookie }
        });

        console.log(`✅ Revocation Verification Status: ${verifyRes.status} (Expected 401)`);
        if (verifyRes.status === 401) {
            console.log('✅ CRITICAL DEFENSE CONFIRMED: All sessions in the family were revoked after reuse detection.');
        } else {
            console.error('❌ FAILURE: The new token is still working! Revocation failed.');
            process.exit(1);
        }
    } else {
        console.error('❌ FAILURE: Token reuse was not detected by the server!');
        process.exit(1);
    }

    console.log('\n✨ Refresh Token Reuse Detection Test passed successfully.');
}

runReuseTest().catch(err => {
    console.error('❌ Test crashed:', err);
    process.exit(1);
});
