import client from './client';

export const authApi = {
    login: (email, password) =>
        client.post('/auth/login', { email, password }).then(res => res.data),

    googleLogin: (token) =>
        client.post('/auth/google', { token }).then(res => res.data),

    register: (userData) =>
        client.post('/auth/register', userData).then(res => res.data),

    logout: () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        return client.post('/auth/logout', { refreshToken: userInfo.refreshToken }).then(res => res.data);
    },

    refresh: () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        return client.post('/auth/refresh', { refreshToken: userInfo.refreshToken }).then(res => res.data);
    },

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

    changePassword: (currentPassword, newPassword) =>
        client.put('/auth/password', { currentPassword, newPassword }).then(res => res.data),
};
