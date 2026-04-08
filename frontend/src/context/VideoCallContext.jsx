import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../utils/socket';
import { useUI } from './UIContext';

const VideoCallContext = createContext();

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export const VideoCallProvider = ({ children }) => {
    const { addToast } = useUI();
    const [callState, setCallState] = useState('idle'); // idle, outgoing, incoming, active
    const [callType, setCallType] = useState('video'); // video, voice
    const [remoteUser, setRemoteUser] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);

    const peerConnection = useRef(null);
    const socket = useRef(null);
    const pendingCandidates = useRef([]);
    const incomingSignal = useRef(null); // Store offer/candidates if they arrive early

    // Cleanup WebRTC
    const cleanupCall = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.onicecandidate = null;
            peerConnection.current.ontrack = null;
            peerConnection.current.onconnectionstatechange = null;
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                localStream.removeTrack(track);
            });
            setLocalStream(null);
        }
        setRemoteStream(null);
        setCallState('idle');
        setRemoteUser(null);
        pendingCandidates.current = [];
        incomingSignal.current = null;
    }, [localStream]);

    // Initialize Media
    const startLocalStream = async (type = 'video') => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: type === 'video', 
                audio: true 
            });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error('Failed to get local stream:', err);
            addToast('Could not access camera/microphone', 'danger');
            return null;
        }
    };

    // Create RTCPeerConnection
    const createPeerConnection = useCallback((targetUserId, stream) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket.current) {
                socket.current.emit('call:signal', {
                    toUserId: targetUserId,
                    signalData: { type: 'candidate', candidate: event.candidate }
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                cleanupCall();
            }
        };

        peerConnection.current = pc;
        return pc;
    }, [cleanupCall]);

    // --- Signaling Handlers ---

    const handleIncomingCall = useCallback(async ({ from, signalData, type = 'video' }) => {
        if (callState !== 'idle') {
            getSocket()?.emit('call:decline', { toUserId: from.id });
            return;
        }
        setRemoteUser(from);
        setCallType(type);
        setCallState('incoming');
        incomingSignal.current = signalData; 
    }, [callState]);

    const addIceCandidate = async (pc, candidate) => {
        try {
            if (candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    };

    const handleCallAccepted = useCallback(async ({ signalData }) => {
        const pc = peerConnection.current;
        if (!pc) return;
        
        setCallState('active');
        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        
        // Process any queued candidates
        while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();
            await addIceCandidate(pc, candidate);
        }
    }, []);

    const handleCallDeclined = useCallback(() => {
        addToast('Call declined', 'info');
        cleanupCall();
    }, [addToast, cleanupCall]);

    const handleSignal = useCallback(async ({ signalData }) => {
        const pc = peerConnection.current;
        
        if (signalData.type === 'offer') {
            // Should be handled by handleIncomingCall first, but safeguard here
            incomingSignal.current = signalData;
        } else if (signalData.type === 'answer') {
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(signalData));
            }
        } else if (signalData.type === 'candidate') {
            if (pc && pc.remoteDescription) {
                await addIceCandidate(pc, signalData.candidate);
            } else {
                pendingCandidates.current.push(signalData.candidate);
            }
        }
    }, []);

    const handleCallEnded = useCallback(() => {
        cleanupCall();
    }, [cleanupCall]);

    // Initialize Socket
    useEffect(() => {
        const s = getSocket();
        if (!s) return;
        socket.current = s;

        s.on('call:incoming', handleIncomingCall);
        s.on('call:accepted', handleCallAccepted);
        s.on('call:declined', handleCallDeclined);
        s.on('call:signal', handleSignal);
        s.on('call:ended', handleCallEnded);

        return () => {
            s.off('call:incoming', handleIncomingCall);
            s.off('call:accepted', handleCallAccepted);
            s.off('call:declined', handleCallDeclined);
            s.off('call:signal', handleSignal);
            s.off('call:ended', handleCallEnded);
        };
    }, [handleIncomingCall, handleCallAccepted, handleCallDeclined, handleSignal, handleCallEnded]);

    // --- Public API ---

    const initiateCall = async (targetUser, type = 'video') => {
        setRemoteUser(targetUser);
        setCallType(type);
        setCallState('outgoing');

        const stream = await startLocalStream(type);
        if (!stream) {
            setCallState('idle');
            return;
        }

        const pc = createPeerConnection(targetUser.id, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.current?.emit('call:request', {
            toUserId: targetUser.id,
            signalData: offer,
            type
        });
    };

    const acceptCall = async () => {
        if (callState !== 'incoming' || !remoteUser || !incomingSignal.current) return;

        const stream = await startLocalStream(callType);
        if (!stream) {
            declineCall();
            return;
        }

        const pc = createPeerConnection(remoteUser.id, stream);
        const offerSignal = incomingSignal.current;
        
        await pc.setRemoteDescription(new RTCSessionDescription(offerSignal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.current?.emit('call:accept', {
            toUserId: remoteUser.id,
            signalData: answer
        });

        // Process any candidates that arrived while waiting to accept
        while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();
            await addIceCandidate(pc, candidate);
        }

        setCallState('active');
    };

    const declineCall = () => {
        if (remoteUser) {
            socket.current?.emit('call:decline', { toUserId: remoteUser.id });
        }
        cleanupCall();
    };

    const endCall = () => {
        if (remoteUser) {
            socket.current?.emit('call:end', { toUserId: remoteUser.id });
        }
        cleanupCall();
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = isCamOff);
            setIsCamOff(!isCamOff);
        }
    };

    return (
        <VideoCallContext.Provider value={{
            callState,
            callType,
            remoteUser,
            localStream,
            remoteStream,
            isMuted,
            isCamOff,
            initiateCall,
            acceptCall,
            declineCall,
            endCall,
            toggleMute,
            toggleCamera
        }}>
            {children}
        </VideoCallContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useVideoCall = () => useContext(VideoCallContext);
