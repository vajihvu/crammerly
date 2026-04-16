// src/components/tabs/VideoTab.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Monitor, MonitorOff, Calendar, Clock, Plus, X, Users, User } from 'lucide-react';
import { useRoomVideo } from '../../hooks/useRoomVideo';

// ── Individual Video Tile ──
const VideoTile = ({ stream, name, avatar, isMuted, isLocal = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some(t => t.enabled);

  return (
    <div className="relative bg-zinc-900 rounded-2xl overflow-hidden border border-brand-border/30 shadow-lg group aspect-video">
      {stream && hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? 'mirror' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
          {avatar ? (
            <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-primary/20 flex items-center justify-center border-2 border-zinc-700">
              <User className="w-8 h-8 text-brand-primary/60" />
            </div>
          )}
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
        {isMuted && <MicOff size={10} className="text-red-400" />}
        <span className="text-[10px] font-bold text-white truncate max-w-[100px]">
          {isLocal ? 'You' : (name || 'Peer')}
        </span>
      </div>

      {/* Live indicator */}
      {stream && hasVideo && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-widest text-white/80">live</span>
        </div>
      )}
    </div>
  );
};

// ── Main VideoTab ──
function VideoTab({ room, currentUser, addToast, onUpdateRoom }) {
  const {
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
    maxPeers
  } = useRoomVideo({ roomId: room?.id, currentUser, addToast });

  // ── Meeting Scheduler State (retained from original) ──
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [calDate] = useState(new Date());

  useEffect(() => {
    if (showScheduler) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [showScheduler]);

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
  const handleDateSelect = (day) => {
    const selected = new Date(calDate.getFullYear(), calDate.getMonth(), day);
    setMeetingDate(selected.toISOString().split('T')[0]);
    setIsDateOpen(false);
  };
  const handleTimeSelect = (time) => { setMeetingTime(time); setIsTimeOpen(false); };
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = i % 12 || 12;
    return `${h.toString().padStart(2, '0')}:00 ${i < 12 ? 'AM' : 'PM'}`;
  });

  const handleSchedule = async () => {
    if (!meetingTopic || !meetingDate || !meetingTime) return;
    const newMeeting = { id: Date.now(), topic: meetingTopic, date: meetingDate, time: meetingTime, scheduledBy: 'You' };
    const updatedRoom = { ...room, meetings: [...(room.meetings || []), newMeeting] };
    const success = await onUpdateRoom(updatedRoom);
    if (success) { setShowScheduler(false); setMeetingTopic(''); setMeetingDate(''); setMeetingTime(''); }
  };
  const removeMeeting = async (meetingId) => {
    await onUpdateRoom({ ...room, meetings: (room.meetings || []).filter(m => m.id !== meetingId) });
  };

  // Build peer array for grid
  const peerArray = Array.from(peers.values());
  const totalParticipants = inCall ? 1 + peerArray.length : 0;
  const gridCols = totalParticipants <= 1 ? 'grid-cols-1' : totalParticipants <= 4 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-4 shadow-xl flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      {!inCall ? (
        /* ── Pre-Call Lobby ── */
        <div className="flex-1 flex flex-col">
          <div className="text-center flex-1 flex flex-col items-center justify-center">
            <Video size={40} className="mx-auto mb-3 text-brand-primary/50" />
            <h3 className="text-xl font-bold mb-1 text-brand-text font-sans">Video Call</h3>
            <p className="text-brand-text-dim text-sm mb-4 font-sans">Start an instant call or schedule one for later</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={joinVideo}
                className="w-full sm:w-auto px-6 py-3 bg-brand-text hover:bg-brand-text/90 text-brand-bg rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 font-sans"
              >
                <Video size={18} /> Start Call
              </button>

              <button
                onClick={() => setShowScheduler(true)}
                className="w-full sm:w-auto px-6 py-3 bg-brand-surface border border-brand-border hover:bg-brand-muted/10 text-brand-text rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 font-sans"
              >
                <Calendar size={18} /> Schedule Meeting
              </button>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-xl mt-4">
              <Users size={12} className="text-brand-primary" />
              <span className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">P2P Mesh · Max {maxPeers} Participants</span>
            </div>
          </div>

          {/* Scheduled Meetings List */}
          {(room.meetings || []).length > 0 && (
            <div className="mt-8 font-sans">
              <h4 className="text-sm font-black uppercase tracking-widest text-brand-primary mb-4 flex items-center gap-2">
                <Clock size={16} /> Scheduled Meetings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(room.meetings || []).map(meeting => (
                  <div key={meeting.id} className="bg-brand-bg/50 border border-brand-border/30 rounded-xl p-4 flex justify-between items-start group hover:border-brand-primary/30 transition-all">
                    <div>
                      <h5 className="font-bold text-brand-text mb-1">{meeting.topic}</h5>
                      <div className="flex items-center gap-3 text-xs text-brand-text-dim">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {meeting.date}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {meeting.time}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMeeting(meeting.id)}
                      className="p-2 text-brand-text-dim hover:text-brand-danger opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduler Modal */}
          {showScheduler && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-sans overflow-y-auto">
              <div className="fixed inset-0 bg-brand-bg/70 backdrop-blur-xl" onClick={() => setShowScheduler(false)}></div>
              <div className="relative bg-brand-surface border border-brand-border w-full max-w-md rounded-[40px] p-8 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 my-auto">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-8 bg-brand-primary rounded-full"></div>
                  <h3 className="text-2xl font-black text-brand-text uppercase tracking-tight">Schedule Meeting</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim mb-2.5 ml-1">Meeting Topic</label>
                    <input
                      type="text" placeholder="e.g. Project Discussion" value={meetingTopic}
                      onChange={(e) => setMeetingTopic(e.target.value)}
                      className="w-full px-5 py-4 bg-brand-bg border border-brand-border/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 text-brand-text placeholder:text-brand-text-dim/50 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Date Picker */}
                    <div className="relative">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim mb-2.5 ml-1">Date</label>
                      <button
                        onClick={() => { setIsDateOpen(!isDateOpen); setIsTimeOpen(false); }}
                        className="w-full px-5 py-4 bg-brand-bg border border-brand-border/40 rounded-2xl flex items-center gap-3 hover:border-brand-primary/50 transition-all text-brand-text font-medium text-sm text-left"
                      >
                        <Calendar size={16} className="text-brand-primary shrink-0" />
                        <span className={meetingDate ? 'text-brand-text' : 'text-brand-text-dim/50'}>
                          {meetingDate && !isNaN(new Date(meetingDate)) ? new Date(meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select Date'}
                        </span>
                      </button>
                      {isDateOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsDateOpen(false)}></div>
                          <div className="absolute bottom-[110%] mb-1 left-0 right-[-40px] md:right-0 bg-brand-surface border border-brand-border shadow-2xl z-[70] rounded-[28px] p-4 sm:p-5 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between mb-3 px-1">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text">
                                {calDate.toLocaleString('default', { month: 'long' })} {calDate.getFullYear()}
                              </h4>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="h-6 flex items-center justify-center text-[9px] font-black text-brand-text-dim/30">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1.5">
                              {Array.from({ length: firstDayOfMonth(calDate.getMonth(), calDate.getFullYear()) }).map((_, i) => <div key={`empty-${i}`} />)}
                              {Array.from({ length: daysInMonth(calDate.getMonth(), calDate.getFullYear()) }).map((_, i) => (
                                <button
                                  key={i + 1} onClick={() => handleDateSelect(i + 1)}
                                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${meetingDate && new Date(meetingDate).getDate() === i + 1 && new Date(meetingDate).getMonth() === calDate.getMonth()
                                    ? 'bg-brand-text text-brand-bg shadow-lg transform scale-110'
                                    : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary'}`}
                                >{i + 1}</button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Time Picker */}
                    <div className="relative">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim mb-2.5 ml-1">Time</label>
                      <button
                        onClick={() => { setIsTimeOpen(!isTimeOpen); setIsDateOpen(false); }}
                        className="w-full px-5 py-4 bg-brand-bg border border-brand-border/40 rounded-2xl flex items-center gap-3 hover:border-brand-primary/50 transition-all text-brand-text font-medium text-sm text-left"
                      >
                        <Clock size={16} className="text-brand-primary shrink-0" />
                        <span className={meetingTime ? 'text-brand-text' : 'text-brand-text-dim/50'}>{meetingTime || 'Select Time'}</span>
                      </button>
                      {isTimeOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsTimeOpen(false)}></div>
                          <div className="absolute bottom-[110%] mb-1 right-0 left-[-20px] md:left-0 bg-brand-surface border border-brand-border shadow-2xl z-[70] rounded-[28px] p-3 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 min-w-[140px]">
                            <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                              {hours.map((time, idx) => (
                                <button key={idx} onClick={() => handleTimeSelect(time)}
                                  className={`py-2.5 px-4 rounded-xl text-[11px] font-[1000] uppercase tracking-[0.1em] text-left transition-all ${meetingTime === time
                                    ? 'bg-brand-text text-brand-bg'
                                    : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary'}`}
                                >{time}</button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button onClick={() => setShowScheduler(false)} className="flex-1 px-6 py-4 bg-brand-muted/10 hover:bg-brand-muted/20 text-brand-text-dim hover:text-brand-text font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95">Cancel</button>
                  <button onClick={handleSchedule} className="flex-[1.5] px-6 py-4 bg-brand-text hover:bg-black text-brand-bg font-[1000] text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                    <Plus size={18} strokeWidth={3} /> Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Active Call View ── */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Live</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-bg border border-brand-border/30 rounded-xl">
                <Users size={12} className="text-brand-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim">{totalParticipants} / {maxPeers}</span>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-brand-bg border border-brand-border/30 rounded-xl">
              <span className="text-[9px] font-black uppercase tracking-widest text-brand-text-dim">P2P Mesh · Encrypted</span>
            </div>
          </div>

          {/* Video Grid */}
          <div className={`flex-1 grid ${gridCols} gap-3 auto-rows-fr min-h-0 overflow-hidden`}>
            {/* Local video */}
            <VideoTile
              stream={localStream}
              name="You"
              avatar={currentUser?.avatar}
              isMuted={isMuted}
              isLocal={true}
            />

            {/* Remote peers */}
            {peerArray.map((peer) => (
              <VideoTile
                key={peer.info.id}
                stream={peer.stream}
                name={peer.info.name}
                avatar={peer.info.avatar}
                isMuted={false}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="mt-3 flex items-center justify-center gap-3 shrink-0">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md ${isMuted ? 'bg-red-500 text-white' : 'bg-brand-surface border border-brand-border text-brand-text-dim hover:bg-brand-muted/20 hover:text-brand-text'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button
              onClick={toggleCamera}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md ${isCamOff ? 'bg-red-500 text-white' : 'bg-brand-surface border border-brand-border text-brand-text-dim hover:bg-brand-muted/20 hover:text-brand-text'}`}
              title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md ${isScreenSharing ? 'bg-brand-primary text-white animate-pulse' : 'bg-brand-surface border border-brand-border text-brand-text-dim hover:bg-brand-muted/20 hover:text-brand-text'}`}
              title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            >
              {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>

            <div className="w-px h-8 bg-brand-border/40 mx-1" />

            <button
              onClick={leaveVideo}
              className="px-6 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <PhoneOff size={18} className="fill-current" />
              Leave
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.mirror { transform: scaleX(-1); }` }} />
    </div>
  );
}

export default VideoTab;
