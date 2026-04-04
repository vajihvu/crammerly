import client from './client';

export const bugsApi = {
    /**
     * Submit a new bug report
     * @param {Object} bugData - { type, title, description, image }
     * @returns {Promise<Object>} The created bug report response
     */
    submitBug: async (bugData) => {
        const response = await client.post('/bugs', bugData);
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
