import client from './client';

/**
 * Todos API Service
 * Handles interaction with the /todos endpoint.
 */
export const todosApi = {
    /**
     * Fetch all todos for the current user
     */
    getAll: () =>
        client.get('/todos').then(res => {
            const data = res.data;
            return (Array.isArray(data) ? data : data.data || []).map(t => ({
                ...t,
                id: t._id || t.id
            }));
        }),

    /**
     * Create a new todo
     */
    create: (text) =>
        client.post('/todos', { text }).then(res => {
            const data = res.data.data || res.data;
            return { ...data, id: data._id || data.id };
        }),

    /**
     * Toggle a todo's completed status
     */
    toggle: (id) =>
        client.put(`/todos/${id}`).then(res => {
            const data = res.data.data || res.data;
            return { ...data, id: data._id || data.id };
        }),

    /**
     * Delete a todo
     */
    delete: (id) =>
        client.delete(`/todos/${id}`).then(res => res.data),
};
