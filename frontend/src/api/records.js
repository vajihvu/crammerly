import client from './client';

export const recordsApi = {
    getAll: (params) =>
        client.get('/records', { params }).then(res => res.data),

    getById: (id) =>
        client.get(`/records/${id}`).then(res => res.data),

    create: (data) =>
        client.post('/records', data).then(res => res.data),

    update: (id, data) =>
        client.put(`/records/${id}`, data).then(res => res.data),

    delete: (id) =>
        client.delete(`/records/${id}`).then(res => res.data),
};
