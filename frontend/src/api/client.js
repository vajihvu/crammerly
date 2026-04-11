import axios from 'axios';
import env from '../config/env';

/**
 * Global API Client (Axios Instance)
 * Centralized configuration for headers, base URL, and interceptors.
 */
const client = axios.create({
    baseURL: env.apiUrl,
    timeout: 60000, // 60s — accounts for Render free tier cold starts (~30-50s)
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Double-submit CSRF bypass — checked by csrf.js middleware
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

        const userInfoString = localStorage.getItem('userInfo');
        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo?.token && !config.headers.Authorization) {
                    config.headers.Authorization = `Bearer ${userInfo.token}`;
                    client._sessionDead = false;
                }
            } catch (e) {
                console.error('Failed to parse userInfo from localStorage:', e);
            }
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
                // Queue concurrent 401s behind a single refresh request
                if (!client._refreshPromise) {
                    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                    client._refreshPromise = axios.post(`${env.apiUrl}/auth/refresh`, {
                        refreshToken: userInfo.refreshToken
                    }, {
                        withCredentials: true,
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-Token': 'XMLHttpRequest'
                        }
                    }).finally(() => {
                        client._refreshPromise = null;
                    });
                }

                const { data } = await client._refreshPromise;

                if (data?.success && data.data?.token) {
                    const newToken = data.data.token;
                    const newRefreshToken = data.data.refreshToken;
                    try {
                        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                        if (userInfo) {
                            userInfo.token = newToken;
                            if (newRefreshToken) userInfo.refreshToken = newRefreshToken;
                            localStorage.setItem('userInfo', JSON.stringify(userInfo));
                        }
                    } catch {
                        // localStorage parse failed — token still usable for this request
                    }

                    client._sessionDead = false;
                    client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return client(originalRequest);
                }
            } catch (refreshError) {
                const status = refreshError.response?.status;
                const errorCode = refreshError.response?.data?.error?.code || refreshError.response?.data?.code;

                if (errorCode === 'AUTH_ROTATION_RACE' || status === 429) {
                    const delay = status === 429 ? 1000 : 0;
                    console.warn(`♻️ Refresh aborted: ${errorCode || 'Rate-limited'}. Retrying in ${delay}ms...`);
                    
                    if (delay > 0) await new Promise(r => setTimeout(r, delay));
                    
                    // Sync token again before retry
                    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                    if (userInfo.token) {
                        originalRequest.headers['Authorization'] = `Bearer ${userInfo.token}`;
                    }
                    return client(originalRequest);
                } else if (status === 401) {
                    // Only emit UNAUTHORIZED for definitive server rejections (expired/revoked session)
                    if (!client._sessionDead) {
                        client._sessionDead = true;
                        console.warn('♻️ Session expired: Token refresh failed. Redirecting to login.');
                        emit(apiEvents.UNAUTHORIZED);
                    }
                } else if (status === 403) {
                    // 403 Forbidden may be due to CSRF or specific resource permissions. 
                    // Don't kill the whole session, just let the request fail.
                    console.warn(`🔒 Refresh blocked: Forbidden (403). Possible CSRF or permission issue. Session preserved.`);
                } else {
                    // Network errors, 500s, etc. shouldn't trigger a global logout! 
                    // Let the individual request fail instead of killing the whole session.
                    console.warn(`⚠️ Refresh failed with non-auth error (${status || 'Network'}). Session preserved.`);
                }
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
