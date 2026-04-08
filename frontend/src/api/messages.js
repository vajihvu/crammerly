import client from './client';

/**
 * Messages API Service (MongoDB Only)
 */
export const messagesApi = {
    /**
     * Fetch all messages for a room
     */
    getAll: async (roomId) => {
        const { data } = await client.get(`/messages/${roomId}`);
        return data.data; // Return the whole data object which contains { messages, nextCursor, hasMore }
    },
    getByRoom: (roomId) => messagesApi.getAll(roomId),

    /**
     * Send a new message to a room
     */
    send: async (roomId, messageData) => {
        const { data } = await client.post(`/messages/${roomId}`, messageData);
        return data.data;
    },

    /**
     * Upload a file
     */
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await client.post('/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.data;
    },

    /**
     * Mark all messages in a room as read
     */
    markAsRead: async (roomId) => {
        const { data } = await client.patch(`/messages/${roomId}/read`);
        return data.data;
    },

    /**
     * REAL-TIME SUBSCRIPTIONS (Supabase removal)
     * For now, real-time is disabled. Components should poll or manually fetch.
     */
    subscribe: () => {
        console.warn('Real-time messaging disabled (Supabase removed).');
        return { unsubscribe: () => { } };
    }
};
