import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [config.clientUrl, 'http://localhost:5173', 'https://crammerly.io'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.user.name} (${socket.id})`);

        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            console.log(`👥 User ${socket.user.name} joined room: ${roomId}`);
        });

        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            console.log(`🚶 User ${socket.user.name} left room: ${roomId}`);
        });

        socket.on('send_message', (data) => {
            // data: { roomId, content, type, fileData }
            const { roomId, content, type, fileData } = data;

            // Broadcast to everyone in the room except sender (or use io.to for everyone)
            // We typically broadcast to everyone so the sender gets the "official" message too
            // or we emit back to sender.

            // For now, let's assume the client adds its own message instantly, 
            // and we just broadcast to others.
            socket.to(roomId).emit('new_message', {
                id: Math.random().toString(36).substring(7), // Temporary ID if not saved to DB yet
                sender_id: socket.user._id,
                senderName: socket.user.name,
                senderTag: socket.user.tag || '0000',
                text: content,
                type: type || 'text',
                fileData: fileData || null,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

/**
 * Emit to a room
 */
export const emitToRoom = (roomId, event, data) => {
    if (io) {
        io.to(roomId).emit(event, data);
    }
};
