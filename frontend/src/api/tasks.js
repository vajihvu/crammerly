import client from './client';

/**
 * Tasks API Service (Project Channels)
 */
export const tasksApi = {
    /** Get all tasks for a room (grouped by status) */
    getAll: async (roomId) => {
        const { data } = await client.get(`/rooms/${roomId}/tasks`);
        return data.data;
    },

    /** Create a new task card */
    create: async (roomId, taskData) => {
        const { data } = await client.post(`/rooms/${roomId}/tasks`, taskData);
        return data.data;
    },

    /** Update a task card */
    update: async (roomId, taskId, updates) => {
        const { data } = await client.put(`/rooms/${roomId}/tasks/${taskId}`, updates);
        return data.data;
    },

    /** Delete a task card */
    remove: async (roomId, taskId) => {
        const { data } = await client.delete(`/rooms/${roomId}/tasks/${taskId}`);
        return data.success;
    },

    /** Claim / unclaim a task */
    claim: async (roomId, taskId) => {
        const { data } = await client.put(`/rooms/${roomId}/tasks/${taskId}/claim`);
        return data.data;
    },

    /** Assign a project role to a member */
    assignRole: async (roomId, memberId, role) => {
        const { data } = await client.put(`/rooms/${roomId}/members/${memberId}/role`, { role });
        return data.data;
    }
};
