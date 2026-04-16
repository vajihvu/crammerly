import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/index.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import logger from './logger.js';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: config.clientUrls,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware for Socket.io
    // Mirrors the HTTP `protect` middleware for consistency
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, config.jwt.secret);
            const user = await User.findById(decoded.id).select('-password +tokenVersion');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            // 1. Account deactivation check
            if (user.isActive === false) {
                return next(new Error('Authentication error: Account deactivated'));
            }

            // 2. Token version check (password change / global logout)
            if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
                return next(new Error('Authentication error: Session revoked'));
            }

            // 3. Session validity check
            if (decoded.sessionId) {
                const session = await Session.findOne({
                    _id: decoded.sessionId,
                    user: user._id,
                    isValid: true,
                    expiresAt: { $gt: new Date() }
                });

                if (!session) {
                    return next(new Error('Authentication error: Session invalid or expired'));
                }
            }

            socket.user = user;
            next();
        } catch (_err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', async (socket) => {
        logger.info(`🔌 User connected: ${socket.user.name} (${socket.id})`);

        // Update online status in DB
        try {
            await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
            // Broadcast to all to update friends list/profiles in realtime
            io.emit('user_status_change', { userId: socket.user._id, isOnline: true });
        } catch (err) {
            logger.error(`Failed to update online status for ${socket.user._id}: ${err.message}`);
        }

        // Join private user room for direct notifications
        socket.join(`user_${socket.user._id}`);

        socket.on('join_room', (roomId) => {
            socket.join(roomId);
            logger.info(`👥 User ${socket.user.name} joined room: ${roomId}`);
        });

        socket.on('leave_room', (roomId) => {
            socket.leave(roomId);
            logger.info(`🚶 User ${socket.user.name} left room: ${roomId}`);
        });

        socket.on('send_message', async (data) => {
            // data: { roomId, content, type, fileData }
            const { roomId, content, type, fileData } = data;

            // 1. Validate content
            if (!content || typeof content !== 'string' || content.length === 0) return;
            if (content.length > 5000) return; // Match Message model maxlength

            // 2. Basic XSS sanitization (mirrors middleware/xss.js)
            const sanitized = content
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/on\w+="[^"]*"/gi, '')
                .replace(/on\w+='[^']*'/gi, '')
                .replace(/javascript:[^"']*/gi, '');

            // 3. Room membership check
            const { default: Room } = await import('../models/Room.js');
            const room = await Room.findById(roomId);
            if (!room || !room.members.some(m => m.user.toString() === socket.user._id.toString())) return;

            // 4. Persist message to MongoDB for chat history
            let messageId = crypto.randomUUID();
            try {
                const { default: Message } = await import('../models/Message.js');
                const saved = await Message.create({
                    roomId: roomId,
                    senderId: socket.user._id,
                    content: sanitized,
                    type: type || 'text',
                    fileData: fileData || undefined
                });
                messageId = saved._id;
            } catch (err) {
                logger.error(`Failed to persist socket message: ${err.message}`);
                // Continue emitting even if persistence fails — realtime shouldn't block on DB
            }

            socket.to(roomId).emit('new_message', {
                id: messageId,
                roomId: roomId,
                senderId: socket.user._id,
                senderName: socket.user.name,
                senderTag: socket.user.tag || '0000',
                content: sanitized,
                text: sanitized,
                type: type || 'text',
                fileData: fileData || null,
                timestamp: new Date().toISOString()
            });
        });

        // --- WebRTC Signaling Events ---

        // 1. Initiate a call
        socket.on('call:request', ({ toUserId, signalData, type }) => {
            io.to(`user_${toUserId}`).emit('call:incoming', {
                from: {
                    id: socket.user._id,
                    name: socket.user.name,
                    avatar: socket.user.avatar,
                    tag: socket.user.tag
                },
                signalData,
                type
            });
            logger.info(`📞 Call request from ${socket.user.name} to user ${toUserId} (type: ${type || 'video'})`);
        });

        // 2. Accept a call
        socket.on('call:accept', ({ toUserId, signalData }) => {
            io.to(`user_${toUserId}`).emit('call:accepted', {
                signalData
            });
            logger.info(`✅ Call accepted by ${socket.user.name} for user ${toUserId}`);
        });

        // 3. Decline a call
        socket.on('call:decline', ({ toUserId }) => {
            io.to(`user_${toUserId}`).emit('call:declined');
            logger.info(`❌ Call declined by ${socket.user.name} for user ${toUserId}`);
        });

        // 4. Forward WebRTC signals (ICE candidates / SDP)
        socket.on('call:signal', ({ toUserId, signalData }) => {
            if (!toUserId) return;
            io.to(`user_${toUserId}`).emit('call:signal', {
                signalData
            });
        });

        // 5. End a call
        socket.on('call:end', ({ toUserId }) => {
            io.to(`user_${toUserId}`).emit('call:ended');
            logger.info(`📴 Call ended by ${socket.user.name}`);
        });

        // --- Room Video (Mesh WebRTC) Events ---

        // Track active video participants per room: Map<roomId, Set<{ id, name, avatar, socketId }>>
        if (!io._videoRooms) io._videoRooms = new Map();

        // Join room video call
        socket.on('room:video:join', ({ roomId }) => {
            if (!roomId) return;
            if (!io._videoRooms.has(roomId)) io._videoRooms.set(roomId, new Map());
            const videoRoom = io._videoRooms.get(roomId);

            // Cap at 6 participants
            if (videoRoom.size >= 6 && !videoRoom.has(socket.user._id.toString())) {
                socket.emit('room:video:full');
                return;
            }

            const userInfo = {
                id: socket.user._id.toString(),
                name: socket.user.name,
                avatar: socket.user.avatar || null,
                socketId: socket.id
            };
            videoRoom.set(socket.user._id.toString(), userInfo);

            // Send existing peers list to the joiner
            const existingPeers = [];
            videoRoom.forEach((peer) => {
                if (peer.id !== userInfo.id) existingPeers.push(peer);
            });
            socket.emit('room:video:peers', { peers: existingPeers });

            // Notify existing participants that a new peer joined
            socket.to(roomId).emit('room:video:peer-joined', { peer: userInfo });

            // Ensure the socket is in the socket.io room for broadcasts
            socket.join(roomId);
            logger.info(`🎥 ${socket.user.name} joined video in room ${roomId} (${videoRoom.size} participants)`);
        });

        // Leave room video call
        socket.on('room:video:leave', ({ roomId }) => {
            if (!roomId) return;
            const videoRoom = io._videoRooms?.get(roomId);
            if (videoRoom) {
                videoRoom.delete(socket.user._id.toString());
                if (videoRoom.size === 0) io._videoRooms.delete(roomId);
            }
            socket.to(roomId).emit('room:video:peer-left', { peerId: socket.user._id.toString() });
            logger.info(`🎥 ${socket.user.name} left video in room ${roomId}`);
        });

        // Relay WebRTC signal (offer/answer/ICE) to a specific peer in the room
        socket.on('room:video:signal', ({ roomId, toUserId, signalData }) => {
            if (!toUserId || !signalData) return;
            const videoRoom = io._videoRooms?.get(roomId);
            if (!videoRoom) return;
            const targetPeer = videoRoom.get(toUserId);
            if (targetPeer) {
                io.to(targetPeer.socketId).emit('room:video:signal', {
                    fromUserId: socket.user._id.toString(),
                    signalData
                });
            }
        });

        socket.on('disconnect', async () => {
            // Update online status in DB
            try {
                // Check if user has other active connections before marking offline
                const activeConnections = await io.in(`user_${socket.user._id}`).fetchSockets();
                if (activeConnections.length === 0) {
                    await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
                    io.emit('user_status_change', { userId: socket.user._id, isOnline: false });
                }
            } catch (err) {
                logger.error(`Failed to update offline status for ${socket.user._id}: ${err.message}`);
            }

            // Clean up video rooms on disconnect
            if (io._videoRooms) {
                io._videoRooms.forEach((videoRoom, roomId) => {
                    if (videoRoom.has(socket.user._id.toString())) {
                        videoRoom.delete(socket.user._id.toString());
                        socket.to(roomId).emit('room:video:peer-left', { peerId: socket.user._id.toString() });
                        if (videoRoom.size === 0) io._videoRooms.delete(roomId);
                    }
                });
            }
            logger.info(`🔌 User disconnected: ${socket.id}`);
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

/**
 * Emit to a specific user
 */
export const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};

/**
 * Emit to all connected clients globally
 */
export const broadcastGlobal = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
