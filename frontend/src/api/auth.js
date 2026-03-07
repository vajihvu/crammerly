import client from './client';

export const authApi = {
    login: (email, password) =>
        client.post('/auth/login', { email, password }).then(res => res.data),

    googleLogin: (token) =>
        client.post('/auth/google', { token }).then(res => res.data),

    register: (userData) =>
        client.post('/auth/register', userData).then(res => res.data),

    logout: () =>
        client.post('/auth/logout').then(res => res.data),

    refresh: () =>
        client.post('/auth/refresh').then(res => res.data),

    getSessions: () =>
        client.get('/auth/sessions').then(res => res.data),

    revokeSession: (id) =>
        client.delete(`/auth/sessions/${id}`).then(res => res.data),

    verifyEmail: (token) =>
        client.get(`/auth/verify-email/${token}`).then(res => res.data),

    forgotPassword: (email) =>
        client.post('/auth/forgot-password', { email }).then(res => res.data),

    resetPassword: (token, password) =>
        client.post(`/auth/reset-password/${token}`, { password }).then(res => res.data),
};
