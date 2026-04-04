import client from './client';

/**
 * Study API Service (MongoDB)
 * Handles journal entries and study notes via the records endpoint.
 */
export const studyApi = {
    journal: {
        getAll: async () => {
            const res = await client.get('/records?tags=journal');
            return res.data.data.records;
        },
        create: async (content) => {
            const res = await client.post('/records', {
                title: `Journal Entry - ${new Date().toLocaleDateString()}`,
                content,
                tags: ['journal'],
                status: 'published'
            });
            return res.data.data;
        },
        delete: async (entryId) => {
            await client.delete(`/records/${entryId}`);
            return true;
        }
    },
    notes: {
        getAll: async () => {
            const res = await client.get('/records?tags=note');
            return (res.data.data.records || []).map(n => ({ ...n, date: n.createdAt }));
        },
        create: async (title, content) => {
            const res = await client.post('/records', {
                title,
                content,
                tags: ['note'],
                status: 'published'
            });
            const data = res.data.data;
            return { ...data, date: data.createdAt };
        },
        delete: async (noteId) => {
            await client.delete(`/records/${noteId}`);
            return true;
        }
    },
    sessions: {
        start: (roomId, task) =>
            client.post('/study-sessions/start', { roomId, task }).then(res => res.data.data),
        end: async (id) => {
            return client.put(`/study-sessions/${id}/end`, {}).then(res => res.data.data);
        },
        getStats: () =>
            client.get('/study-sessions/stats').then(res => res.data.data),
        getAll: () =>
            client.get('/study-sessions').then(res => res.data.data),
    }
};
