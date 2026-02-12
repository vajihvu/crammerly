import { io } from 'socket.io-client';
import env from '../config/env';

let socket;

export const initSocket = (token) => {
    if (socket) return socket;

    // Use environment variable for backend URL, default to localhost:5000
    const baseURL = env.apiUrl.replace('/api/v1', '');

    socket = io(baseURL, {
        auth: { token },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinRoom = (roomId) => {
    if (socket) socket.emit('join_room', roomId);
};

export const leaveRoom = (roomId) => {
    if (socket) socket.emit('leave_room', roomId);
};
