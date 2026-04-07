/**
 * Friends API Service
 * Handles friendships and social searching natively attached to the database.
 */
import client from './client';

export const friendsApi = {
    /**
     * Fetch all friends for the current user
     */
    getAll: async () => {
        const { data } = await client.get('/friends');
        return Array.isArray(data.data) ? data.data : [];
    },

    /**
     * Send a friend request
     */
    sendRequest: async (toUserId) => {
        const { data } = await client.post('/friends/request', { toUserId });
        return data;
    },

    /**
     * Accept a friend request
     */
    acceptRequest: async (requestId) => {
        const { data } = await client.post(`/friends/accept/${requestId}`);
        return data;
    },

    /**
     * Decline a friend request
     */
    declineRequest: async (requestId) => {
        const { data } = await client.post(`/friends/decline/${requestId}`);
        return data;
    },

    /**
     * Remove or reject a friend
     */
    remove: async (friendId) => {
        const { data } = await client.delete(`/friends/${friendId}`);
        return data;
    },

    /**
     * Search for users to add or fetch algorithmic suggestions (if query is empty)
     */
    search: async (query = '') => {
        const { data } = await client.get(`/friends/search?q=${encodeURIComponent(query)}`);
        return data.data || [];
    }
};
