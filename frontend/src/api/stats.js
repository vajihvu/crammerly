import client from './client';

export const statsApi = {
    getPublicStats: () =>
        client.get('/stats/public').then(res => res.data),
};
