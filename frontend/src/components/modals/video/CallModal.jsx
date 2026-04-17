import React, { useEffect, useRef } from 'react';
import { useVideoCall } from '../../../context/VideoCallContext';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize, Minimize, User, Volume2, VolumeX } from 'lucide-react';

const CallModal = () => {
    const {
        callState,
        callType,
        remoteUser,
        localStream,
        remoteStream,
        isMuted,
        isCamOff,
        acceptCall,
        declineCall,
        endCall,
        toggleMute
    } = useVideoCall();
    
    const [isSpeakerOff, setIsSpeakerOff] = React.useState(false);

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
            <div className="relative w-full h-[90vh] md:h-auto max-w-4xl md:aspect-video bg-zinc-900 rounded-3xl md:rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-zinc-800 scale-in-center">
                
                {/* Video Container */}
                <div className="relative flex-1 bg-black group">
                    {/* Remote Video / Voice Placeholder */}
                    {/* Remote Video / Voice Placeholder */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-contain transition-opacity duration-700 ${callState === 'active' && remoteStream && callType === 'video' ? 'opacity-100' : 'opacity-0 absolute'}`}
                    />

                    {(callState !== 'active' || !remoteStream || callType === 'voice') && (
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
                        <div className={`absolute top-6 right-6 w-32 sm:w-48 aspect-video bg-zinc-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl transition-all duration-500 ${callState === 'active' ? 'opacity-100' : 'opacity-40'}`}>
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
                    <div className="absolute top-6 left-6 z-50 flex items-center gap-2">
                        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">SECURE P2P</span>
                        </div>
                    </div>

                    {/* Call Controls Bar (Moved inside relative container for guaranteed visibility) */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 sm:gap-6 px-4 sm:px-8 py-3 sm:py-4 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] sm:rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 duration-700 w-[90%] sm:w-auto overflow-hidden">
                        {callState === 'incoming' ? (
                            <>
                                <button
                                    onClick={acceptCall}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 hover:bg-green-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-110 active:scale-95 transition-all group"
                                >
                                    <Phone size={24} className="sm:w-7 sm:h-7 fill-current" />
                                </button>
                                <button
                                    onClick={declineCall}
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-110 active:scale-95 transition-all"
                                >
                                    <PhoneOff size={24} className="sm:w-7 sm:h-7 fill-current" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={toggleMute}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    {isMuted ? <MicOff size={18} className="sm:w-5 sm:h-5" /> : <Mic size={18} className="sm:w-5 sm:h-5" />}
                                    <span className="text-[6px] sm:text-[7px] font-black uppercase mt-1 tracking-widest opacity-60">Mute</span>
                                </button>
                                
                                <button
                                    onClick={() => {
                                        if (remoteVideoRef.current) {
                                            remoteVideoRef.current.muted = !isSpeakerOff;
                                            setIsSpeakerOff(!isSpeakerOff);
                                        }
                                    }}
                                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center transition-all ${isSpeakerOff ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                >
                                    {isSpeakerOff ? <VolumeX size={18} className="sm:w-5 sm:h-5" /> : <Volume2 size={18} className="sm:w-5 sm:h-5" />}
                                    <span className="text-[6px] sm:text-[7px] font-black uppercase mt-1 tracking-widest opacity-60">Speaker</span>
                                </button>

                                <button
                                    onClick={endCall}
                                    className="px-4 sm:px-8 h-12 sm:h-14 rounded-full bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[8px] sm:text-[10px] tracking-[0.2em] shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 border border-white/10"
                                >
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <PhoneOff size={12} className="sm:w-4 sm:h-4 fill-current" />
                                    </div>
                                    <span className="hidden xs:inline">End Session</span>
                                    <span className="xs:hidden">End</span>
                                </button>
                            </>
                        )}
                    </div>
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
