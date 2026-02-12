import client from './client';

export const authApi = {
    login: (email, password) =>
        client.post('/auth/login', { email, password }).then(res => res.data),

    register: (userData) =>
        client.post('/auth/register', userData).then(res => res.data),

    logout: () =>
        client.post('/auth/logout').then(res => res.data),

    refresh: () =>
        client.post('/auth/refresh').then(res => res.data),
};
