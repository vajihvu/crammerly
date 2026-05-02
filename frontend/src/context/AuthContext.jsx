import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authApi, usersApi } from '../api';
import { apiEvents } from '../api/client';
import { initSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem('userInfo');
            return raw ? JSON.parse(raw) : null;
        } catch {
            localStorage.removeItem('userInfo');
            return null;
        }
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Try to get fresh profile data to verify current token/session
                const response = await usersApi.getProfile();
                if (response.success) {
                    updateUser(response.data);
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    logout(true);
                }
            } finally {
                setLoading(false);
            }
        };
        verifySession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const sessionVerified = !loading;

    const logout = useCallback(async (skipServerLogOut = false) => {
        // Capture refresh token BEFORE clearing storage so the server logout can still revoke the session
        let refreshToken = null;
        try {
            const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
            refreshToken = stored.refreshToken;
        } catch { /* ignore */ }

        localStorage.removeItem('userInfo');
        setUser(null);
        disconnectSocket();

        if (!skipServerLogOut && refreshToken) {
            try {
                await authApi.logout(); // revoke server-side session
            } catch {
                // Ignore logout errors — session may already be expired
            }
        }
    }, []);

    useEffect(() => {
        // Listen for global unauthorized events (session expired, token refresh failed)
        const handleUnauthorized = () => {
            console.warn('🚨 Global Unauthorized Event: Logging out...');
            logout(true); // Skip server logout — the session is already dead server-side
        };

        window.addEventListener(apiEvents.UNAUTHORIZED, handleUnauthorized);
        return () => window.removeEventListener(apiEvents.UNAUTHORIZED, handleUnauthorized);
    }, [logout]);

    useEffect(() => {
        if (!sessionVerified) return;

        if (user?.token) {
            const socket = initSocket(user.token);
            // If token changed but socket is already there, update the auth object for potential reconnects
            if (socket.auth && socket.auth.token !== user.token) {
                socket.auth.token = user.token;
            }
        } else {
            disconnectSocket();
        }
    }, [user?.token, sessionVerified]);

    const login = async (email, password) => {
        try {
            const response = await authApi.login(email, password);
            if (response.success) {
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                setUser(response.data);
                return response.data;
            }
            throw new Error(response?.error?.message || response?.message || 'Login failed');
        } catch (err) {
            throw new Error(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                err.message ||
                'Login failed',
                { cause: err }
            );
        }
    };

    const googleLogin = async (token) => {
        try {
            const response = await authApi.googleLogin(token);
            if (response.success) {
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                setUser(response.data);
                return response.data;
            }
            throw new Error(response?.error?.message || response?.message || 'Google Login failed');
        } catch (err) {
            throw new Error(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                err.message ||
                'Google Login failed',
                { cause: err }
            );
        }
    };

    const register = async (userData) => {
        try {
            const response = await authApi.register(userData);
            if (response.success) {
                if (response.data?.token) {
                    localStorage.setItem('userInfo', JSON.stringify(response.data));
                    setUser(response.data);
                }
                return response.data;
            }
            throw new Error(response?.error?.message || response?.message || 'Registration failed');
        } catch (err) {
            throw new Error(
                err.response?.data?.error?.message ||
                err.response?.data?.message ||
                err.message ||
                'Registration failed',
                { cause: err }
            );
        }
    };

    const updateUser = useCallback((data) => {
        setUser(prev => {
            if (!prev) return prev;
            
            // CRITICAL: Read latest localStorage to avoid overwriting tokens refreshed by interceptors in the background
            let latestToken = prev.token;
            let latestRefreshToken = prev.refreshToken;
            try {
                const storageData = JSON.parse(localStorage.getItem('userInfo'));
                if (storageData?.token) {
                    latestToken = storageData.token;
                }
                if (storageData?.refreshToken) {
                    latestRefreshToken = storageData.refreshToken;
                }
            } catch (e) {
                console.error('Failed to sync tokens from storage:', e);
            }

            // Support both { user: ... } and just the user object
            const userData = data?.user || data;
            const next = {
                ...prev,
                token: data?.token || latestToken,
                refreshToken: data?.refreshToken || latestRefreshToken,
                user: { ...prev.user, ...userData }
            };

            localStorage.setItem('userInfo', JSON.stringify(next));
            return next;
        });
    }, []);

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            register, 
            logout, 
            googleLogin,
            updateUser,
            loading 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
