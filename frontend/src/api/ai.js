import client from './client';

const aiApi = {
    chat: async (message, context = []) => {
        const response = await client.post('/ai/chat', { message, context });
        return response.data;
    }
};

export default aiApi;
