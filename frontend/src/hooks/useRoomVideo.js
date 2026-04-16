// src/hooks/useRoomVideo.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../utils/socket';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

const MAX_PEERS = 6;

/**
 * Manages a mesh of RTCPeerConnections for room-level group video.
 * Each participant connects P2P to every other participant.
 */
export function useRoomVideo({ roomId, currentUser, addToast }) {
    const [inCall, setInCall] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [peers, setPeers] = useState(new Map()); // Map<peerId, { info, stream }>
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const peerConnections = useRef(new Map()); // Map<peerId, RTCPeerConnection>
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const inCallRef = useRef(false);

    // Keep refs in sync
    useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
    useEffect(() => { inCallRef.current = inCall; }, [inCall]);

    // ── Remove a peer connection ──
    const removePeer = useCallback((peerId) => {
        const pc = peerConnections.current.get(peerId);
        if (pc) {
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.onconnectionstatechange = null;
            pc.close();
            peerConnections.current.delete(peerId);
        }
        setPeers(prev => {
            const next = new Map(prev);
            next.delete(peerId);
            return next;
        });
    }, []);

    // ── Create a peer connection to a specific remote user ──
    const createPeerConnection = useCallback((peerId, peerInfo, isInitiator) => {
        const socket = getSocket();
        if (!socket) return null;

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        // Handle incoming remote tracks
        pc.ontrack = (event) => {
            setPeers(prev => {
                const next = new Map(prev);
                next.set(peerId, { info: peerInfo, stream: event.streams[0] });
                return next;
            });
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('room:video:signal', {
                    roomId,
                    toUserId: peerId,
                    signalData: { type: 'candidate', candidate: event.candidate }
                });
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                removePeer(peerId);
            }
        };

        peerConnections.current.set(peerId, pc);

        // If we are the initiator (existing participant), create and send an offer
        if (isInitiator) {
            (async () => {
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('room:video:signal', {
                        roomId,
                        toUserId: peerId,
                        signalData: offer
                    });
                } catch (err) {
                    console.error('Failed to create offer for peer:', peerId, err);
                }
            })();
        }

        return pc;
    }, [roomId, removePeer]);

    // ── Cleanup all connections ──
    const cleanupAll = useCallback(() => {
        peerConnections.current.forEach((pc) => {
            pc.onicecandidate = null;
            pc.ontrack = null;
            pc.onconnectionstatechange = null;
            pc.close();
        });
        peerConnections.current.clear();
        setPeers(new Map());

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        setIsMuted(false);
        setIsCamOff(false);
    }, []);

    // ── Join the video call ──
    const joinVideo = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setInCall(true);

            const socket = getSocket();
            if (socket) {
                socket.emit('room:video:join', { roomId });
            }
        } catch (err) {
            console.error('Failed to get media:', err);
            addToast?.('Could not access camera/microphone. Please check permissions.', 'danger');
        }
    }, [roomId, addToast]);

    // ── Leave the video call ──
    const leaveVideo = useCallback(() => {
        const socket = getSocket();
        if (socket) {
            socket.emit('room:video:leave', { roomId });
        }
        cleanupAll();
        setInCall(false);
    }, [roomId, cleanupAll]);

    // ── Toggle mute ──
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const newState = !isMuted;
            localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = !newState; });
            setIsMuted(newState);
        }
    }, [isMuted]);

    // ── Toggle camera ──
    const toggleCamera = useCallback(() => {
        if (localStreamRef.current) {
            const newState = !isCamOff;
            localStreamRef.current.getVideoTracks().forEach(track => { track.enabled = !newState; });
            setIsCamOff(newState);
        }
    }, [isCamOff]);

    // ── Toggle screen sharing ──
    const toggleScreenShare = useCallback(async () => {
        if (isScreenSharing) {
            // Stop screen share, restore camera
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }
            // Re-enable camera track on all peer connections
            const camTrack = localStreamRef.current?.getVideoTracks()[0];
            if (camTrack) {
                peerConnections.current.forEach((pc) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(camTrack);
                });
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace camera track with screen track on all peers
                peerConnections.current.forEach((pc) => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });

                // When user stops sharing via browser UI
                screenTrack.onended = () => {
                    const camTrack = localStreamRef.current?.getVideoTracks()[0];
                    if (camTrack) {
                        peerConnections.current.forEach((pc) => {
                            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                            if (sender) sender.replaceTrack(camTrack);
                        });
                    }
                    screenStreamRef.current = null;
                    setIsScreenSharing(false);
                };

                setIsScreenSharing(true);
            } catch (err) {
                console.error('Screen share failed:', err);
                // User cancelled the picker — not an error
            }
        }
    }, [isScreenSharing]);

    // ── Socket event listeners ──
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        // Receive existing peers when we join
        const handlePeers = ({ peers: peerList }) => {
            if (!inCallRef.current) return;
            peerList.forEach((peerInfo) => {
                if (peerInfo.id !== currentUser?.id) {
                    // We are the new joiner; existing peers will send us offers
                    // Pre-register the peer connection so it's ready when the offer arrives
                    if (!peerConnections.current.has(peerInfo.id)) {
                        createPeerConnection(peerInfo.id, peerInfo, false);
                    }
                }
            });
        };

        // A new peer joined — we (existing participant) initiate an offer
        const handlePeerJoined = ({ peer }) => {
            if (!inCallRef.current) return;
            if (peer.id === currentUser?.id) return;
            createPeerConnection(peer.id, peer, true);
        };

        // A peer left
        const handlePeerLeft = ({ peerId }) => {
            removePeer(peerId);
        };

        // Receive a WebRTC signal (offer/answer/ICE)
        const handleSignal = async ({ fromUserId, signalData }) => {
            if (!inCallRef.current) return;

            let pc = peerConnections.current.get(fromUserId);

            if (signalData.type === 'offer') {
                // If we don't have a connection yet, create one
                if (!pc) {
                    pc = createPeerConnection(fromUserId, { id: fromUserId, name: 'Peer' }, false);
                }
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(signalData));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    socket.emit('room:video:signal', {
                        roomId,
                        toUserId: fromUserId,
                        signalData: answer
                    });
                } catch (err) {
                    console.error('Error handling offer from', fromUserId, err);
                }
            } else if (signalData.type === 'answer') {
                if (pc) {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
                    } catch (err) {
                        console.error('Error handling answer from', fromUserId, err);
                    }
                }
            } else if (signalData.type === 'candidate') {
                if (pc && pc.remoteDescription) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                    } catch (err) {
                        console.error('Error adding ICE candidate:', err);
                    }
                }
            }
        };

        // Room is full
        const handleFull = () => {
            addToast?.('Video call is full (max 6 participants)', 'warning');
            setInCall(false);
        };

        socket.on('room:video:peers', handlePeers);
        socket.on('room:video:peer-joined', handlePeerJoined);
        socket.on('room:video:peer-left', handlePeerLeft);
        socket.on('room:video:signal', handleSignal);
        socket.on('room:video:full', handleFull);

        return () => {
            socket.off('room:video:peers', handlePeers);
            socket.off('room:video:peer-joined', handlePeerJoined);
            socket.off('room:video:peer-left', handlePeerLeft);
            socket.off('room:video:signal', handleSignal);
            socket.off('room:video:full', handleFull);
        };
    }, [roomId, currentUser?.id, createPeerConnection, removePeer, addToast]);

    // Auto-leave on unmount
    useEffect(() => {
        return () => {
            if (inCallRef.current) {
                const socket = getSocket();
                if (socket) socket.emit('room:video:leave', { roomId });
                cleanupAll();
            }
        };
    }, [roomId, cleanupAll]);

    return {
        inCall,
        localStream,
        peers,
        isMuted,
        isCamOff,
        isScreenSharing,
        joinVideo,
        leaveVideo,
        toggleMute,
        toggleCamera,
        toggleScreenShare,
        maxPeers: MAX_PEERS
    };
}
