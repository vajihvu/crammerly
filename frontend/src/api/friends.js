/**
 * Friends API Service (Backend Pending)
 * Handles friendships and social searching.
 */
export const friendsApi = {
    /**
     * Fetch all friends/requests for a user
     */
    getAll: async (userId) => {
        // TODO: Implement backend friends logic
        return [];
    },

    /**
     * Send a friend request
     */
    sendRequest: async (userId, friendId) => {
        return { success: true };
    },

    /**
     * Accept a friend request
     */
    acceptRequest: async (friendshipId) => {
        return { success: true };
    },

    /**
     * Remove or reject a friend
     */
    remove: async (friendshipId) => {
        return true;
    },

    /**
     * Search for users to add
     */
    search: async (query) => {
        return [];
    }
};
