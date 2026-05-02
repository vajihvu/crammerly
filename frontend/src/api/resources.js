import client from './client';

/**
 * Resources API Service (Project Library)
 */
export const resourcesApi = {
    /** Get all resources for a room */
    getAll: async (roomId, params = {}) => {
        const { data } = await client.get(`/rooms/${roomId}/resources`, { params });
        return data.data;
    },

    /** Add a new resource */
    create: async (roomId, resourceData) => {
        const { data } = await client.post(`/rooms/${roomId}/resources`, resourceData);
        return data.data;
    },

    /** Update a resource */
    update: async (roomId, resourceId, updates) => {
        const { data } = await client.put(`/rooms/${roomId}/resources/${resourceId}`, updates);
        return data.data;
    },

    /** Delete a resource */
    remove: async (roomId, resourceId) => {
        const { data } = await client.delete(`/rooms/${roomId}/resources/${resourceId}`);
        return data.success;
    }
};
