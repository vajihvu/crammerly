// src/hooks/useRooms.js
import { useState, useEffect, useCallback } from 'react';
import { roomsApi } from '../api';
import { getSocket } from '../utils/socket';

/**
 * Manages all room state: loading, CRUD, join, leave, and real-time socket updates.
 */
export function useRooms({ authUser, currentUser, addToast, openConfirm }) {
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [roomsError, setRoomsError] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [isInRoom, setIsInRoom] = useState(false);

    // ── Load all rooms ──
    const loadRooms = useCallback(async () => {
        if (!authUser) return;
        setLoadingRooms(true);
        setRoomsError(null);
        try {
            const loadedRooms = await roomsApi.getAll();
            setRooms(loadedRooms);
        } catch (err) {
            console.error('Room loading error:', err);
            setRoomsError('Failed to load rooms');
        } finally {
            setLoadingRooms(false);
        }
    }, [authUser]);

    // ── Initial fetch + socket listeners ──
    useEffect(() => {
        // Reuse loadRooms — no duplicate fetch
        loadRooms();

        const socket = getSocket();
        if (socket) {
            const handleMemberJoined = ({ id, name }) => {
                setRooms(prev => prev.map(r => {
                    if (r.id === currentRoom?.id) {
                        const isAlreadyMember = r.members.some(m => m.id === id);
                        if (!isAlreadyMember) {
                            return { ...r, members: [...r.members, { id, name, progress: [] }] };
                        }
                    }
                    return r;
                }));

                if (currentRoom) {
                    setCurrentRoom(prev => {
                        if (!prev) return prev;
                        const isAlreadyMember = prev.members.some(m => m.id === id);
                        if (isAlreadyMember) return prev;
                        return { ...prev, members: [...prev.members, { id, name, progress: [] }] };
                    });
                }
            };

            const handleProgressUpdated = ({ userId, progress }) => {
                setRooms(prev => prev.map(r => {
                    if (r.id === currentRoom?.id) {
                        return { ...r, members: r.members.map(m => m.id === userId ? { ...m, progress } : m) };
                    }
                    return r;
                }));

                if (currentRoom) {
                    setCurrentRoom(prev => {
                        if (!prev) return prev;
                        return { ...prev, members: prev.members.map(m => m.id === userId ? { ...m, progress } : m) };
                    });
                }
            };

            const handleRoomDeleted = ({ roomId, roomName, deletedBy }) => {
                // Remove room from list
                setRooms(prev => prev.filter(r => r.id !== roomId));
                // If user is currently in the deleted room, kick them out
                setCurrentRoom(prev => {
                    if (prev && prev.id === roomId) {
                        setIsInRoom(false);
                        addToast(`"${roomName}" was deleted by ${deletedBy}`, 'info');
                        return null;
                    }
                    return prev;
                });
            };

            const handleMemberLeft = ({ id, name }) => {
                setRooms(prev => prev.map(r => {
                    if (r.id === currentRoom?.id) {
                        return { ...r, members: r.members.filter(m => m.id !== id) };
                    }
                    return r;
                }));

                if (currentRoom) {
                    setCurrentRoom(prev => {
                        if (!prev) return prev;
                        return { ...prev, members: prev.members.filter(m => m.id !== id) };
                    });
                }
            };

            socket.on('member_joined', handleMemberJoined);
            socket.on('progress_updated', handleProgressUpdated);
            socket.on('room_deleted', handleRoomDeleted);
            socket.on('member_left', handleMemberLeft);

            return () => {
                socket.off('member_joined', handleMemberJoined);
                socket.off('progress_updated', handleProgressUpdated);
                socket.off('room_deleted', handleRoomDeleted);
                socket.off('member_left', handleMemberLeft);
            };
        }
    }, [loadRooms, currentRoom, authUser]);

    // ── Create room (requires auth) ──
    const createRoom = async (roomName, task, topic, privacy, scheduleDate, scheduleTime) => {
        if (!authUser) {
            addToast('Please sign in to create a room', 'error');
            return false;
        }

        const newRoomData = {
            name: roomName, task, topic,
            privacy: privacy || 'Public',
            scheduleDate: scheduleDate || null,
            scheduleTime: scheduleTime || null
        };

        try {
            const createdRoom = await roomsApi.create(newRoomData);
            setRooms(prev => [createdRoom, ...prev]);
            setCurrentRoom(createdRoom);
            setIsInRoom(true);
            addToast(`Room "${roomName}" created successfully!`, 'success');
            return true;
        } catch (error) {
            console.error('Failed to create room:', error);
            addToast(error?.response?.data?.error?.message || 'Failed to create room. Please check your connection or login status.', 'error');
            return false;
        }
    };

    // ── Join room ──
    const joinRoom = async (room, code = undefined) => {
        const userId = currentUser.id;
        const isAlreadyMember = room.members?.some(m => m.id === userId);
        const updatedRoom = {
            ...room,
            members: isAlreadyMember ? room.members : [...(room.members || []), { id: userId, name: currentUser.name, progress: [] }]
        };

        try {
            await roomsApi.join(room.id, code);
        } catch (error) {
            console.error('Failed to join room:', error);
            return false;
        }

        setCurrentRoom(updatedRoom);
        setIsInRoom(true);
        setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
        addToast(`Successfully joined ${room.name}!`, 'success');
        return true;
    };

    // ── Join by code ──
    const joinRoomByCode = async (code) => {
        try {
            const room = await roomsApi.getByCode(code);
            if (!room) {
                addToast('Invalid room code or room not found', 'error');
                return false;
            }
            return await joinRoom(room, code);
        } catch (error) {
            addToast('Invalid room code or room not found', 'error');
            console.error('Failed to join room by code:', error);
            return false;
        }
    };

    // ── Leave room (local state only — called after API actions) ──
    const leaveRoom = () => {
        setCurrentRoom(null);
        setIsInRoom(false);
        loadRooms();
    };

    // ── Delete room (owner) or Leave room (member) ──
    const deleteRoom = async (room, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const isOwner = room.creator_id === currentUser.id;
        if (isOwner) {
            openConfirm({
                title: 'Delete Room',
                message: `Are you sure you want to permanently delete "${room.name}"? All members will be removed and notified.`,
                onConfirm: async () => {
                    try {
                        if (authUser) await roomsApi.delete(room.id);
                        if (currentRoom?.id === room.id) leaveRoom();
                        setRooms(prev => prev.filter(r => r.id !== room.id));
                        addToast('Room deleted successfully', 'success');
                    } catch (error) {
                        console.error('Failed to delete room:', error);
                        addToast('Failed to delete room', 'error');
                    }
                },
                type: 'danger',
                confirmText: 'Delete Room'
            });
        } else {
            openConfirm({
                title: 'Leave Room',
                message: `Are you sure you want to leave "${room.name}"?`,
                onConfirm: async () => {
                    try {
                        if (authUser) await roomsApi.leave(room.id);
                        if (currentRoom?.id === room.id) leaveRoom();
                        setRooms(prev => prev.map(r => {
                            if (r.id === room.id) {
                                return { ...r, members: r.members.filter(m => m.id !== currentUser.id) };
                            }
                            return r;
                        }));
                        addToast('Left room successfully', 'success');
                    } catch (error) {
                        console.error('Failed to leave room:', error);
                        addToast('Failed to leave room', 'error');
                    }
                },
                type: 'warning',
                confirmText: 'Leave Room'
            });
        }
    };

    // ── Mark progress ──
    const markProgress = async (taskText) => {
        if (!currentRoom || !taskText?.trim()) return;
        try {
            const newProgress = await roomsApi.updateProgress(currentRoom.id, { task: taskText });
            const userId = currentUser.id;
            const updatedMembers = currentRoom.members.map(m => m.id === userId ? { ...m, progress: newProgress } : m);
            const updatedRoom = { ...currentRoom, members: updatedMembers };
            setCurrentRoom(updatedRoom);
            addToast('Progress updated!', 'success');
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    };

    // ── Update room (stub) ──
    const updateRoom = async () => {
        addToast('Feature pending backend update', 'info');
        return false;
    };

    return {
        rooms, loadingRooms, roomsError, loadRooms,
        currentRoom, setCurrentRoom, isInRoom, setIsInRoom,
        createRoom, joinRoom, joinRoomByCode, leaveRoom, deleteRoom,
        markProgress, updateRoom
    };
}
