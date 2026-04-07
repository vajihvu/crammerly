import React, { useEffect, useRef } from 'react';
import { useVideoCall } from '../../../context/VideoCallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize, Minimize, User } from 'lucide-react';

const CallModal = () => {
    const {
        callState,
        remoteUser,
        localStream,
        remoteStream,
        isMuted,
        isCamOff,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera
    } = useVideoCall();

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, callState]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callState]);

    if (callState === 'idle') return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-zinc-800 scale-in-center">
                
                {/* Video Container */}
                <div className="relative flex-1 bg-black group">
                    {/* Remote Video / Voice Placeholder */}
                    {callState === 'active' && remoteStream && callType === 'video' ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-zinc-900 to-black">
                            <div className={`relative w-40 h-40 rounded-full border-4 border-zinc-700 flex items-center justify-center overflow-hidden shadow-2xl ${callState === 'active' ? 'ring-4 ring-brand-primary animate-pulse' : ''}`}>
                                {remoteUser?.avatar ? (
                                    <img src={remoteUser.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-20 h-20 text-zinc-500" />
                                )}
                                {callType === 'voice' && callState === 'active' && (
                                    <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="w-1.5 h-8 bg-white rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-white tracking-tight">{remoteUser?.name || 'User'}</h3>
                                <p className="text-brand-primary font-black uppercase text-[10px] tracking-[0.3em] mt-3">
                                    {callState === 'outgoing' ? 'Ringing...' : 
                                     callState === 'incoming' ? 'Incoming Call' : 
                                     callType === 'voice' ? 'Voice Session Active' : 'Connecting Video...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Local Video (Picture-in-Picture) - only for video calls */}
                    {callType === 'video' && (
                        <div className={`absolute bottom-6 right-6 w-48 aspect-video bg-zinc-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl transition-all duration-500 ${callState === 'active' ? 'opacity-100' : 'opacity-40'}`}>
                            {localStream && !isCamOff ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover mirror"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                    <VideoOff className="w-8 h-8 text-zinc-600" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top Overlay Controls */}
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">SECURE P2P</span>
                        </div>
                    </div>
                </div>

                {/* Call Controls Bar */}
                <div className="h-24 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-8 px-8">
                    {callState === 'incoming' ? (
                        <>
                            <button
                                onClick={acceptCall}
                                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all group"
                            >
                                <Phone className="w-8 h-8 text-white fill-current" />
                            </button>
                            <button
                                onClick={declineCall}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                            >
                                <PhoneOff className="w-8 h-8 text-white fill-current" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={toggleMute}
                                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>
                            
                            <button
                                onClick={toggleCamera}
                                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all ${isCamOff ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                            >
                                {isCamOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </button>

                            <div className="w-px h-10 bg-zinc-800" />

                            <button
                                onClick={endCall}
                                className="px-8 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-red-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                <PhoneOff className="w-5 h-5 fill-current" />
                                End Call
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .mirror { transform: scaleX(-1); }
                .scale-in-center { animation: scale-in-center 0.6s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
                @keyframes scale-in-center {
                    0% { transform: scale(0.7); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes wave {
                    0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
                    50% { transform: scaleY(1.5); opacity: 1; }
                }
                .animate-wave { animation: wave 0.6s ease-in-out infinite; }
            `}} />
        </div>
    );
};

export default CallModal;
