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

    const [loading, setLoading] = useState(false);

    const logout = useCallback(async () => {
        try {
            await authApi.logout(); // revoke server-side session
        } catch {
            // Ignore logout errors
        }
        localStorage.removeItem('userInfo');
        setUser(null);
        disconnectSocket();
    }, []);

    useEffect(() => {
        // Listen for global unauthorized events
        const handleUnauthorized = () => {
            logout();
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

    const register = async (userData) => {
        try {
            const response = await authApi.register(userData);
            if (response.success) {
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                setUser(response.data);
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

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
