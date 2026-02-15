
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';

const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    validateStatus: () => true
});

const TEST_USER = {
    email: `token_ver_test_${Date.now()}@example.com`,
    password: 'TR-vx-99-Alpha-!@#',
    name: 'Version Tester',
    newPassword: 'NEW-TR-vx-99-Alpha-!@#'
};

async function runTokenVersionTest() {
    console.log('🚀 Starting Access Token Invalidation (tokenVersion) Test...');

    // 1. Setup
    console.log('\n1. Registering and verifying user...');
    const reg = await client.post('/auth/register', TEST_USER);
    if (reg.data.data?.verificationToken) {
        await client.get(`/auth/verify-email/${reg.data.data.verificationToken}`);
    }
    console.log('✅ User ready.');

    // 2. Initial Login
    console.log('\n2. Logging in to get initial access token...');
    const loginRes = await client.post('/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password
    });

    if (loginRes.status !== 200) {
        console.error('❌ Login failed:', loginRes.status, loginRes.data);
        process.exit(1);
    }

    const accessToken = loginRes.data.data.token;
    if (!accessToken) {
        console.error('❌ Login failed: No access token in response.', JSON.stringify(loginRes.data));
        process.exit(1);
    }
    console.log('✅ Initial access token received.');

    // 3. Verify access token works
    console.log('\n3. Verifying access token works (Profile access)...');
    const profileRes = await client.get('/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (profileRes.status !== 200) {
        console.error('❌ Token verification failed:', profileRes.status, JSON.stringify(profileRes.data));
        process.exit(1);
    }
    console.log('✅ Access token is valid.');

    // 4. Password Change
    console.log('\n4. Changing password (should increment tokenVersion)...');
    const changeRes = await client.put('/auth/profile', {
        password: TEST_USER.newPassword
    }, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (changeRes.status !== 200) {
        console.error('❌ Password change failed:', changeRes.status, JSON.stringify(changeRes.data));
        process.exit(1);
    }
    console.log('✅ Password changed successfully.');

    // 5. Verify Invalidation
    console.log('\n5. Verifying OLD access token is now invalid (due to tokenVersion mismatch)...');
    const profile2Res = await client.get('/auth/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log(`✅ Invalidation Response Status: ${profile2Res.status} (Expected 401)`);
    console.log(`✅ Invalidation Error Message: ${JSON.stringify(profile2Res.data.error || profile2Res.data.message)}`);

    if (profile2Res.status === 401) {
        console.log('✅ SUCCESS: Old access token was correctly revoked via tokenVersion check.');
    } else {
        console.error('❌ FAILURE: Old access token is still working after password change!');
        process.exit(1);
    }

    console.log('\n✨ Access Token Invalidation Test passed successfully.');
}

runTokenVersionTest().catch(err => {
    console.error('❌ Test crashed:', err);
    process.exit(1);
});
