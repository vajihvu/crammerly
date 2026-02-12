/**
 * Friends API Service (Stub)
 * Handles friendships and social searching.
 */
export const friendsApi = {
    /**
     * Fetch all friends/requests for a user
     */
    getAll: async (userId) => {
        console.log('Fetching friends for', userId);
        return [];
    },

    /**
     * Send a friend request
     */
    sendRequest: async (userId, friendId) => {
        console.log('Sending request from', userId, 'to', friendId);
        return { success: true };
    },

    /**
     * Accept a friend request
     */
    acceptRequest: async (friendshipId) => {
        console.log('Accepting friendship', friendshipId);
        return { success: true };
    },

    /**
     * Remove or reject a friend
     */
    remove: async (friendshipId) => {
        console.log('Removing friendship', friendshipId);
        return true;
    },

    /**
     * Search for users to add
     */
    search: async (query) => {
        console.log('Searching for users with query:', query);
        return [];
    }
};