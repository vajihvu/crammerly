import client from './client';

/**
 * Users API Service (MongoDB Only)
 */
export const usersApi = {
    // NODE BACKEND METHODS
    getProfile: () =>
        client.get('/auth/profile').then(res => res.data),

    updateProfile: (data) =>
        client.put('/auth/profile', data).then(res => res.data),

    deactivate: () =>
        client.delete('/auth/profile').then(res => res.data),

    getOnboarding: () =>
        client.get('/auth/onboarding').then(res => res.data),

    completeOnboarding: (data) =>
        client.post('/auth/onboarding/complete', data).then(res => res.data),

    // LEGACY COMPATIBILITY (Failsafe)
    ensureProfile: async () => { },
    ensureDemoProfile: async () => { },
    updateSupabaseProfile: async (userId, profileData) => {
        return usersApi.updateProfile(profileData);
    }
};
