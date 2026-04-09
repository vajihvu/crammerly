import client from './client';

export const bugsApi = {
    /**
     * Submit a new bug report
     * @param {Object} bugData - { type, title, description, image }
     * @returns {Promise<Object>} The created bug report response
     */
    submitBug: async (bugData) => {
        // Use _retry: true to tell the axios interceptor NOT to trigger a global logout 
        // if this specific non-critical request fails with a 401.
        const response = await client.post('/bugs', bugData, { _retry: true });
        return response.data;
    },

    /**
     * Get all bug reports (Admin only)
     * @param {number} page 
     * @param {number} limit 
     * @returns {Promise<Object>}
     */
    getBugReports: async (page = 1, limit = 20) => {
        const response = await client.get(`/bugs?page=${page}&limit=${limit}`);
        return response.data;
    }
};
