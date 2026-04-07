import client from './client';

export const notificationsApi = {
    /**
     * Get all notifications
     */
    getAll: async () => {
        const { data } = await client.get('/notifications');
        return data.data || [];
    },

    /**
     * Mark a specific notification as read
     */
    markRead: async (id) => {
        const { data } = await client.put(`/notifications/${id}/read`);
        return data;
    },

    /**
     * Mark all notifications as read
     */
    markAllRead: async () => {
        const { data } = await client.put('/notifications/read-all');
        return data;
    }
};
