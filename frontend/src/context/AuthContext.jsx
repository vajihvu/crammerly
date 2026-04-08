import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authApi } from '../api';
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
                const response = await authApi.getProfile();
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
    }, []); // Run once on mount

    const logout = useCallback(async (skipServerLogOut = false) => {
        localStorage.removeItem('userInfo');
        setUser(null);
        disconnectSocket();

        if (!skipServerLogOut) {
            try {
                await authApi.logout(); // revoke server-side session
            } catch {
                // Ignore logout errors
            }
        }
    }, []);

    useEffect(() => {
        // Listen for global unauthorized events
        const handleUnauthorized = () => {
            logout(true);
        };

        window.addEventListener(apiEvents.UNAUTHORIZED, handleUnauthorized);
        return () => window.removeEventListener(apiEvents.UNAUTHORIZED, handleUnauthorized);
    }, [logout]);

    useEffect(() => {
        if (user?.token) {
            initSocket(user.token);
        } else {
            disconnectSocket();
        }
    }, [user?.token]);

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
                'Login failed'
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
                'Google Login failed'
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
                'Registration failed'
            );
        }
    };

    const updateUser = useCallback((data) => {
        setUser(prev => {
            if (!prev) return prev;
            // Support both { user: ... } and just the user object
            const userData = data?.user || data;
            const next = {
                ...prev,
                user: { ...prev.user, ...userData }
            };
            // If data contains a token (e.g. password change), update it too
            if (data?.token) {
                next.token = data.token;
            }
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
