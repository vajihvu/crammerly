import { io } from 'socket.io-client';
import env from '../config/env';

let socket;
let connectionListeners = [];

// Connection state tracking
export const ConnectionState = {
    CONNECTED: 'connected',
    CONNECTING: 'connecting',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
};

let currentState = ConnectionState.DISCONNECTED;

const notifyListeners = (state, detail = null) => {
    currentState = state;
    connectionListeners.forEach(fn => fn(state, detail));
};

export const onConnectionChange = (callback) => {
    connectionListeners.push(callback);
    // Immediately notify with current state
    callback(currentState);
    return () => {
        connectionListeners = connectionListeners.filter(fn => fn !== callback);
    };
};

export const getConnectionState = () => currentState;

export const initSocket = (token) => {
    if (socket) return socket;

    const baseURL = env.apiUrl.replace('/api/v1', '');

    notifyListeners(ConnectionState.CONNECTING);

    socket = io(baseURL, {
        auth: { token },
        transports: ['polling', 'websocket'], // Start with polling to prevent Render drop errors, upgrade silently
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        timeout: 20000,
    });

    socket.on('connect', () => {
        if (import.meta.env.DEV) console.log('🔌 Socket connected:', socket.id);
        notifyListeners(ConnectionState.CONNECTED);
    });

    socket.on('disconnect', (reason) => {
        if (import.meta.env.DEV) console.warn('⚠️ Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
            // Server initiated disconnect — won't auto-reconnect
            notifyListeners(ConnectionState.DISCONNECTED, reason);
        }
        // Otherwise socket.io will auto-reconnect
    });

    socket.io.on('reconnect_attempt', (attempt) => {
        if (import.meta.env.DEV) console.log(`🔄 Reconnection attempt ${attempt}...`);
        notifyListeners(ConnectionState.RECONNECTING, { attempt });
    });

    socket.io.on('reconnect', (attempt) => {
        if (import.meta.env.DEV) console.log(`✅ Reconnected after ${attempt} attempts`);
        notifyListeners(ConnectionState.CONNECTED);
    });

    socket.io.on('reconnect_failed', () => {
        if (import.meta.env.DEV) console.error('❌ Reconnection failed after all attempts');
        notifyListeners(ConnectionState.ERROR, 'Reconnection failed');
    });

    socket.on('connect_error', (err) => {
        if (import.meta.env.DEV) console.error('❌ Socket connection error:', err.message);
        notifyListeners(ConnectionState.ERROR, err.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        notifyListeners(ConnectionState.DISCONNECTED);
    }
};

export const reconnectSocket = () => {
    if (socket && !socket.connected) {
        notifyListeners(ConnectionState.RECONNECTING);
        socket.connect();
    }
};

export const joinRoom = (roomId) => {
    if (socket) socket.emit('join_room', roomId);
};

export const leaveRoom = (roomId) => {
    if (socket) socket.emit('leave_room', roomId);
};
