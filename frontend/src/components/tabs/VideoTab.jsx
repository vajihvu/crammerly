// src/components/tabs/VideoTab.jsx
import React, { useState, useEffect } from 'react';
import { Video, Mic, MicOff, VideoOff, PhoneOff, Monitor, MonitorOff, Calendar, Clock, Plus, X } from 'lucide-react';

function VideoTab({ room, onUpdateRoom }) {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingTopic, setMeetingTopic] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // Lock scroll when modal is open
  useEffect(() => {
    if (showScheduler) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showScheduler]);

  // Custom Date/Time State
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [calDate] = useState(new Date());

  // Mini Calendar Logic
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day) => {
    const selected = new Date(calDate.getFullYear(), calDate.getMonth(), day);
    setMeetingDate(selected.toISOString().split('T')[0]);
    setIsDateOpen(false);
  };

  const handleTimeSelect = (time) => {
    setMeetingTime(time);
    setIsTimeOpen(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    return `${h.toString().padStart(2, '0')}:00 ${ampm}`;
  });

  const handleSchedule = async () => {
    if (!meetingTopic || !meetingDate || !meetingTime) return;

    const newMeeting = {
      id: Date.now(),
      topic: meetingTopic,
      date: meetingDate,
      time: meetingTime,
      scheduledBy: 'You'
    };

    const updatedRoom = {
      ...room,
      meetings: [...(room.meetings || []), newMeeting]
    };

    const success = await onUpdateRoom(updatedRoom);
    if (success) {
      setShowScheduler(false);
      setMeetingTopic('');
      setMeetingDate('');
      setMeetingTime('');
    }
  };

  const removeMeeting = async (meetingId) => {
    const updatedRoom = {
      ...room,
      meetings: (room.meetings || []).filter(m => m.id !== meetingId)
    };
    await onUpdateRoom(updatedRoom);
  };

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border p-6 shadow-xl flex-1 flex flex-col min-h-[500px]">
      {!inCall ? (
        <div className="flex-1 flex flex-col">
          <div className="text-center py-12">
            <Video size={64} className="mx-auto mb-6 text-brand-primary/50" />
            <h3 className="text-2xl font-bold mb-2 text-brand-text font-sans">Video Call</h3>
            <p className="text-brand-text-dim mb-8 font-sans">Start an instant call or schedule one for later</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setInCall(true)}
                className="w-full sm:w-auto px-8 py-4 bg-brand-text hover:bg-brand-text/90 text-brand-bg rounded-xl text-lg font-semibold inline-flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 font-sans"
              >
                <Video size={24} /> Start Call
              </button>

              <button
                onClick={() => setShowScheduler(true)}
                className="w-full sm:w-auto px-8 py-4 bg-brand-surface border border-brand-border hover:bg-brand-muted/10 text-brand-text rounded-xl text-lg font-semibold inline-flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 font-sans"
              >
                <Calendar size={24} /> Schedule Meeting
              </button>
            </div>
            <p className="text-xs text-brand-text-dim opacity-50 mt-6 font-sans">Demo feature. Full implementation requires WebRTC.</p>
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

          {/* Scheduler Modal/Overlay */}
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
                      type="text"
                      placeholder="e.g. Project Discussion"
                      value={meetingTopic}
                      onChange={(e) => setMeetingTopic(e.target.value)}
                      className="w-full px-5 py-4 bg-brand-bg border border-brand-border/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/50 text-brand-text placeholder:text-brand-text-dim/50 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* CUSTOM DATE PICKER */}
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
                                  key={i + 1}
                                  onClick={() => handleDateSelect(i + 1)}
                                  className={`h-8 w-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${meetingDate && new Date(meetingDate).getDate() === i + 1 && new Date(meetingDate).getMonth() === calDate.getMonth()
                                    ? 'bg-brand-text text-brand-bg shadow-lg transform scale-110'
                                    : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary'
                                    }`}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* CUSTOM TIME PICKER */}
                    <div className="relative">
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim mb-2.5 ml-1">Time</label>
                      <button
                        onClick={() => { setIsTimeOpen(!isTimeOpen); setIsDateOpen(false); }}
                        className="w-full px-5 py-4 bg-brand-bg border border-brand-border/40 rounded-2xl flex items-center gap-3 hover:border-brand-primary/50 transition-all text-brand-text font-medium text-sm text-left"
                      >
                        <Clock size={16} className="text-brand-primary shrink-0" />
                        <span className={meetingTime ? 'text-brand-text' : 'text-brand-text-dim/50'}>
                          {meetingTime || 'Select Time'}
                        </span>
                      </button>

                      {isTimeOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsTimeOpen(false)}></div>
                          <div className="absolute bottom-[110%] mb-1 right-0 left-[-20px] md:left-0 bg-brand-surface border border-brand-border shadow-2xl z-[70] rounded-[28px] p-3 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200 min-w-[140px]">
                            <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                              {hours.map((time, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleTimeSelect(time)}
                                  className={`py-2.5 px-4 rounded-xl text-[11px] font-[1000] uppercase tracking-[0.1em] text-left transition-all ${meetingTime === time
                                    ? 'bg-brand-text text-brand-bg'
                                    : 'text-brand-text hover:bg-brand-primary/10 hover:text-brand-primary'
                                    }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-10">
                  <button
                    onClick={() => setShowScheduler(false)}
                    className="flex-1 px-6 py-4 bg-brand-muted/10 hover:bg-brand-muted/20 text-brand-text-dim hover:text-brand-text font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSchedule}
                    className="flex-[1.5] px-6 py-4 bg-brand-text hover:bg-black text-brand-bg font-[1000] text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} strokeWidth={3} /> Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(room.members || []).map((member, idx) => (
              <div key={idx} className="aspect-video bg-brand-bg rounded-xl border border-brand-border flex items-center justify-center relative overflow-hidden group">
                <div className="w-20 h-20 bg-brand-muted rounded-3xl flex items-center justify-center text-3xl font-black text-brand-text shadow-2xl rotate-3 transition-transform group-hover:scale-110">
                  {(member.name || '?')[0].toUpperCase()}
                </div>
                <div className="absolute bottom-3 left-3 bg-brand-bg/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold text-brand-text border border-brand-border/50">{member.name || 'Anonymous'}</div>
                {/* Simulated video indicator */}
                <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-brand-bg animate-pulse"></div>
              </div>
            ))}
            {isScreenSharing && (
              <div className="aspect-video bg-brand-primary/10 rounded-xl border-2 border-dashed border-brand-primary flex items-center justify-center relative animate-pulse col-span-2">
                <div className="flex flex-col items-center gap-3">
                  <Monitor size={48} className="text-brand-primary" />
                  <p className="text-brand-primary text-[10px] font-black uppercase tracking-widest">You are sharing your screen</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto flex justify-center gap-4">
            <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition-all shadow-premium active:scale-95 ${isMuted ? 'bg-brand-primary text-white' : 'bg-brand-muted/20 text-brand-text-dim hover:bg-brand-muted/40 hover:text-brand-text'}`}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <button onClick={() => setIsVideoOff(!isVideoOff)} className={`p-4 rounded-full transition-all shadow-premium active:scale-95 ${isVideoOff ? 'bg-brand-primary text-white' : 'bg-brand-muted/20 text-brand-text-dim hover:bg-brand-muted/40 hover:text-brand-text'}`}>
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            <button onClick={() => setIsScreenSharing(!isScreenSharing)} className={`p-4 rounded-full transition-all shadow-premium active:scale-95 ${isScreenSharing ? 'bg-brand-primary text-white animate-pulse' : 'bg-brand-muted/20 text-brand-text-dim hover:bg-brand-muted/40 hover:text-brand-text'}`}>
              {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
            </button>
            <button onClick={() => { setInCall(false); setIsScreenSharing(false); }} className="p-4 rounded-full bg-brand-danger text-white transition-all shadow-premium active:scale-95 hover:opacity-90">
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoTab;