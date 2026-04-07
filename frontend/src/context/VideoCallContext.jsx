import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../utils/socket';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
    const { user } = useAuth();
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

    const ICE_SERVERS = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    // Cleanup WebRTC
    const cleanupCall = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setCallState('idle');
        setRemoteUser(null);
        pendingCandidates.current = [];
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
        // We'll store the initial signal data to use when accepting
        peerConnection.current = signalData; 
    }, [callState]);

    const handleCallAccepted = useCallback(async ({ signalData }) => {
        if (!peerConnection.current) return;
        setCallState('active');
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(signalData));
        
        // Process any queued candidates
        while (pendingCandidates.current.length > 0) {
            const candidate = pendingCandidates.current.shift();
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }, []);

    const handleCallDeclined = useCallback(() => {
        addToast('Call declined', 'info');
        cleanupCall();
    }, [addToast, cleanupCall]);

    const handleSignal = useCallback(async ({ signalData }) => {
        const pc = peerConnection.current;
        if (!pc || pc instanceof RTCSessionDescription) return; // Still in signaling phase

        if (signalData.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.current?.emit('call:accept', { toUserId: remoteUser?.id, signalData: answer });
        } else if (signalData.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        } else if (signalData.type === 'candidate') {
            if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } else {
                pendingCandidates.current.push(signalData.candidate);
            }
        }
    }, [remoteUser]);

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
        if (callState !== 'incoming' || !remoteUser) return;

        const stream = await startLocalStream(callType);
        if (!stream) {
            declineCall();
            return;
        }

        const pc = createPeerConnection(remoteUser.id, stream);
        const offerSignal = peerConnection.current; // Stored offer
        
        await pc.setRemoteDescription(new RTCSessionDescription(offerSignal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.current?.emit('call:accept', {
            toUserId: remoteUser.id,
            signalData: answer
        });

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

export const useVideoCall = () => useContext(VideoCallContext);
