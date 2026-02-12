/**
 * Activity API Service (Stub)
 * Handles study heatmap data.
 */
export const activityApi = {
    /**
     * Fetch study activity map for a user
     */
    getHeatmap: async (userId) => {
        // userId used for log to avoid unused warning and track session
        console.log(`Fetching heatmap for: ${userId}`);
        return {};
    },

    /**
     * Log a study session for today
     */
    logSession: async (userId) => {
        console.log(`Logging session for: ${userId}`);
        return { success: true };
    }
};