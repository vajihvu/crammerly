import client from './client';

/**
 * Sessions API Service
 * Handles user active sessions/devices.
 */
export const sessionsApi = {
    /**
     * Fetch list of active sessions for the current user
     */
    getAll: () =>
        client.get('/auth/sessions').then(res => {
            const data = res.data;
            return data.success ? data.data : (data.data || data);
        }),

    /**
     * Revoke a specific session
     */
    revoke: (id) =>
        client.delete(`/auth/sessions/${id}`).then(res => res.data.success),
};
