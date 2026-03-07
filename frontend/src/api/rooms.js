import client from './client';

/**
 * Rooms API Service (MongoDB Only)
 */
export const roomsApi = {
    /**
     * Fetch all rooms
     */
    getAll: async () => {
        const { data } = await client.get('/rooms');
        return data.data;
    },

    /**
     * Create a room
     */
    create: async (roomData) => {
        const { data } = await client.post('/rooms', roomData);
        return data.data;
    },

    /**
     * Join a room
     */
    join: async (roomId) => {
        const { data } = await client.post(`/rooms/${roomId}/join`);
        return data.success;
    },

    /**
     * Get room by code
     */
    getByCode: async (code) => {
        const { data } = await client.get(`/rooms/code/${code}`);
        return data.data;
    },

    /**
     * Delete room
     */
    delete: async (roomId) => {
        const { data } = await client.delete(`/rooms/${roomId}`);
        return data.success;
    },

    /**
     * Update progress
     */
    updateProgress: async (roomId, progressData) => {
        const { data } = await client.put(`/rooms/${roomId}/progress`, progressData);
        return data.data;
    },

};
