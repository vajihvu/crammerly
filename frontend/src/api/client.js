import axios from 'axios';
import env from '../config/env';

/**
 * Global API Client (Axios Instance)
 * Centralized configuration for headers, base URL, and interceptors.
 */
const client = axios.create({
    baseURL: env.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Handle cookies for refresh tokens
});

// Event listeners for global error/loading notifications
// This allows the UI layer (UIContext) to listen for API events
export const apiEvents = {
    ERROR: 'api:error',
    LOADING: 'api:loading',
    UNAUTHORIZED: 'api:unauthorized',
};

const emit = (event, detail) => {
    window.dispatchEvent(new CustomEvent(event, { detail }));
};

// Request Interceptor: Auth & Loading
client.interceptors.request.use(
    (config) => {
        // Show loading if not disabled for this request
        if (!config.hideLoader) {
            emit(apiEvents.LOADING, true);
        }

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo?.token) {
            config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
        return config;
    },
    (error) => {
        emit(apiEvents.LOADING, false);
        return Promise.reject(error);
    }
);

// Response Interceptor: Error Handling & Token Refresh
client.interceptors.response.use(
    (response) => {
        emit(apiEvents.LOADING, false);
        return response;
    },
    async (error) => {
        emit(apiEvents.LOADING, false);
        const originalRequest = error.config;

        // 1. Handle Token Refresh (401)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axios.post(`${env.apiUrl}/auth/refresh`, {}, { withCredentials: true });

                if (data?.success && data.data?.token) {
                    const newToken = data.data.token;
                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                    userInfo.token = newToken;
                    localStorage.setItem('userInfo', JSON.stringify(userInfo));

                    client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return client(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - trigger logout
                emit(apiEvents.UNAUTHORIZED);
                return Promise.reject(refreshError);
            }
        }

        // 2. Global Error Formatting & Notification
        const errorMessage = error.response?.data?.error?.message
            || error.response?.data?.message
            || error.message
            || 'An unexpected error occurred';

        // Don't show toast if silenced
        if (!originalRequest.silent) {
            emit(apiEvents.ERROR, {
                message: errorMessage,
                status: error.response?.status,
                code: error.response?.data?.error?.code
            });
        }

        return Promise.reject(error);
    }
);

export default client;
