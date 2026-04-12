import client from './client';

export const adminApi = {
    /**
     * Get all users (Paginated)
     * @param {number} page 
     * @param {number} limit 
     * @param {string} search 
     */
    getUsers: async (page = 1, limit = 20, search = '') => {
        const response = await client.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
        return response.data;
    },

    /**
     * Toggle User Status (Ban/Unban)
     * @param {string} id 
     * @param {boolean} isActive 
     */
    toggleUserStatus: async (id, isActive) => {
        const response = await client.patch(`/admin/users/${id}/status`, { isActive });
        return response.data;
    },

    /**
     * Update User Role
     * @param {string} id 
     * @param {string} role 
     */
    updateUserRole: async (id, role) => {
        const response = await client.patch(`/admin/users/${id}/role`, { role });
        return response.data;
    }
};
