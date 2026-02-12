/**
 * Activity API Service (Stub)
 * Handles study heatmap data.
 */
export const activityApi = {
    /**
     * Fetch study activity map for a user
     */
    getHeatmap: async (userId) => {
        return {};
    },

    /**
     * Log a study session for today
     */
    logSession: async (userId) => {
        return { success: true };
    }
};
