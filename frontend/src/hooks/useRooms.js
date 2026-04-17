// src/hooks/useRooms.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { roomsApi } from '../api';
import { getSocket } from '../utils/socket';

/**
 * Manages all room state: loading, CRUD, join, leave, and real-time socket updates.
 */
export function useRooms({ authUser, currentUser, addToast, openConfirm, skip = false }) {
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [roomsError, setRoomsError] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [isInRoom, setIsInRoom] = useState(false);
    const currentRoomRef = useRef(currentRoom);

    // Sync ref with state
    useEffect(() => {
        currentRoomRef.current = currentRoom;
    }, [currentRoom]);

    // ── Load all rooms ──
    const loadRooms = useCallback(async () => {
        if (!authUser) return;
        setLoadingRooms(true);
        setRoomsError(null);
        try {
            const loadedRooms = await roomsApi.getAll();
            if (Array.isArray(loadedRooms)) {
                setRooms(loadedRooms);
            } else {
                setRooms([]);
            }
        } catch (err) {
            if (err.response?.status !== 401) {
                console.error('Room loading error:', err);
                setRoomsError('Failed to load rooms');
            }
            setRooms([]); // Reset to empty array on error to prevent crash
        } finally {
            setLoadingRooms(false);
        }
    }, [authUser]);

    // ── Initial fetch + socket listeners ──
    useEffect(() => {
        if (skip) return;
        // Reuse loadRooms — no duplicate fetch
        loadRooms();

        const socket = getSocket();
        if (socket) {
            const handleMemberJoined = ({ id, name }) => {
                const activeId = currentRoomRef.current?.id;
                setRooms(prev => Array.isArray(prev) ? prev.map(r => {
                    if (r.id === activeId) {
                        const isAlreadyMember = Array.isArray(r.members) && r.members.some(m => m.id === id);
                        if (!isAlreadyMember) {
                            return { ...r, members: [...(r.members || []), { id, name, progress: [] }] };
                        }
                    }
                    return r;
                }) : []);

                if (currentRoomRef.current) {
                    setCurrentRoom(prev => {
                        if (!prev) return prev;
                        const isAlreadyMember = prev.members.some(m => m.id === id);
                        if (isAlreadyMember) return prev;
                        return { ...prev, members: [...prev.members, { id, name, progress: [] }] };
                    });
                }
            };

            const handleProgressUpdated = ({ userId, progress }) => {
                const activeId = currentRoomRef.current?.id;
                setRooms(prev => prev.map(r => {
                    if (r.id === activeId) {
                        return { ...r, members: r.members.map(m => m.id === userId ? { ...m, progress } : m) };
                    }
                    return r;
                }));

                if (currentRoomRef.current) {
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

            const handleMemberLeft = ({ id }) => {
                setRooms(prev => Array.isArray(prev) ? prev.map(r => {
                    return {
                        ...r,
                        members: Array.isArray(r.members) ? r.members.filter(m => m.id !== id) : []
                    };
                }) : []);

                if (currentRoomRef.current) {
                    setCurrentRoom(prev => {
                        if (!prev) return prev;
                        return { ...prev, members: prev.members.filter(m => m.id !== id) };
                    });
                }
            };

            const handleRoomCapacityUpdated = ({ roomId, members }) => {
                setRooms(prev => Array.isArray(prev) ? prev.map(r => {
                    if (r.id === roomId) {
                        return { ...r, members: members };
                    }
                    return r;
                }) : []);
            };

            socket.on('member_joined', handleMemberJoined);
            socket.on('progress_updated', handleProgressUpdated);
            socket.on('room_deleted', handleRoomDeleted);
            socket.on('member_left', handleMemberLeft);
            socket.on('room_capacity_updated', handleRoomCapacityUpdated);

            return () => {
                socket.off('member_joined', handleMemberJoined);
                socket.off('progress_updated', handleProgressUpdated);
                socket.off('room_deleted', handleRoomDeleted);
                socket.off('member_left', handleMemberLeft);
                socket.off('room_capacity_updated', handleRoomCapacityUpdated);
            };
        }
    }, [loadRooms, authUser, addToast, skip]); // currentRoom handled by Ref to avoid loop

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
        if (!currentUser || !currentUser.id) {
            addToast('Please sign in to join rooms', 'warning');
            return false;
        }

        const userId = currentUser.id;
        const isAlreadyMember = Array.isArray(room.members) && room.members.some(m => m.id === userId);
        const updatedRoom = {
            ...room,
            members: isAlreadyMember ? room.members : [...(room.members || []), { id: userId, name: currentUser.name, progress: [] }]
        };

        try {
            const response = await roomsApi.join(room.id, code);
            // Unified success check: response must exist and not have success: false
            if (!response || response.success === false) {
                // If the API call succeeded but returned a fail status (rare), 
                // we might want a toast, but usually the backend returns 4xx/5xx for failures
                // which is handled by the global interceptor.
                return false;
            }
        } catch {
            // Error handled globally by client.js interceptor (shows toast with backend message)
            return false;
        }

        // Only update state if join was successful
        setCurrentRoom(updatedRoom);
        setIsInRoom(true);
        setRooms(prev => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.map(r => r.id === room.id ? updatedRoom : r);
        });
        
        addToast(`Successfully joined ${room.name}!`, 'success');
        return true;
    };

    // ── Join by code ──
    const joinRoomByCode = async (code) => {
        try {
            const roomData = await roomsApi.getByCode(code);
            if (roomData && roomData.id) {
                // IMPORTANT: Must pass the code here so joinRoom can send it to the backend
                return await joinRoom(roomData, code);
            }
            return false;
        } catch {
            // Error handled globally by client.js interceptor
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
        const isOwner = room.creatorId === currentUser.id;
        const isMember = Array.isArray(room.members) && room.members.some(m => (m.id === currentUser.id || m.profile_id === currentUser.id));

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
        } else if (isMember) {
            openConfirm({
                title: 'Leave Room',
                message: `Are you sure you want to leave "${room.name}"?`,
                onConfirm: async () => {
                    try {
                        if (authUser) await roomsApi.leave(room.id);
                        if (currentRoom?.id === room.id) leaveRoom();
                        setRooms(prev => prev.map(r => {
                            if (r.id === room.id) {
                                return { ...r, members: r.members.filter(m => m.id !== currentUser.id && m.profile_id !== currentUser.id) };
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
        } else {
            openConfirm({
                title: 'Hide Room',
                message: `Are you sure you want to hide "${room.name}"? This room will be removed from your current view.`,
                onConfirm: async () => {
                    setRooms(prev => prev.filter(r => r.id !== room.id));
                    addToast('Room hidden', 'info');
                },
                type: 'info',
                confirmText: 'Hide Room'
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
