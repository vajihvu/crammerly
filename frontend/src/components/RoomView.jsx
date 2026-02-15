// src/components/RoomView.jsx
import React from 'react';
import { Users, Trash2, EyeOff, MessageCircle, Video, Bot, TrendingUp, ChevronLeft, Settings2, Check, X, Clock } from 'lucide-react';

import ChatTab from './tabs/ChatTab';
import VideoTab from './tabs/VideoTab';
import AITutorTab from './tabs/AITutorTab';
import ProgressTab from './tabs/ProgressTab';

function RoomView({ room, currentUser, onMarkProgress, onDeleteRoom, onSendMessage, onUpdateRoom, activeTab, setActiveTab, addToast, focusSession, onStartFocus, onEndFocus }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedRoom, setEditedRoom] = React.useState(room || {});

  if (!room || !room.members) return null;

  const currentMember = (room.members || []).find(m => (m.id || m.profile_id) === currentUser.id);
  const isOwner = room.creator_id === currentUser.id;

  const handleUpdate = () => {
    onUpdateRoom(editedRoom);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 pb-8 sm:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-brand-card rounded-2xl p-6 border border-brand-border shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 blur-3xl rounded-full"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <input
                      type="text"
                      value={editedRoom.name}
                      onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-primary/30 rounded-lg px-3 py-1.5 font-bold text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      placeholder="Room Name"
                    />
                    <input
                      type="text"
                      value={editedRoom.task}
                      onChange={(e) => setEditedRoom({ ...editedRoom, task: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-text focus:outline-none"
                      placeholder="Goal"
                    />
                    <input
                      type="text"
                      value={editedRoom.topic}
                      onChange={(e) => setEditedRoom({ ...editedRoom, topic: e.target.value })}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-text focus:outline-none"
                      placeholder="Subject"
                    />
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleUpdate} className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-accent hover:scale-105 transition-all"><Check size={14} /> Save</button>
                      <button onClick={() => { setIsEditing(false); setEditedRoom({ ...room }); }} className="flex-1 py-2 bg-brand-muted/20 text-brand-text-dim rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-muted/40 transition-all"><X size={14} /> Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold mb-3 text-brand-text truncate leading-tight">{room.name || 'Untitled Room'}</h2>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest min-w-[70px]">Goal:</span>
                        <p className="text-brand-text-dim text-sm truncate">{room.task || 'No goal set'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest min-w-[70px]">Topic:</span>
                        <p className="text-brand-text-dim text-sm truncate">{room.topic || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest min-w-[70px]">View:</span>
                        <p className="text-brand-text-dim text-sm truncate">{room.privacy || 'Public'}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary hover:text-brand-primary/80 transition-colors bg-brand-primary/5 px-4 py-2 rounded-xl border border-brand-primary/10"
                      >
                        <Settings2 size={12} /> Edit Settings
                      </button>
                    )}
                  </>
                )}
              </div>
              <button onClick={(e) => onDeleteRoom(room, e)} className="p-2 hover:bg-brand-muted/20 rounded-lg transition-all">
                {isOwner ? <Trash2 size={18} className="text-brand-danger" /> : <EyeOff size={18} className="text-brand-muted" />}
              </button>
            </div>
            {room.privacy === 'Private' && room.code && (
              <div className="bg-brand-bg rounded-lg p-3 border border-brand-primary/10 shadow-sm">
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Room Code</p>
                <p className="font-mono text-xl font-black text-brand-text tracking-widest">{room.code}</p>
              </div>
            )}
          </div>

          <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold"><Clock size={20} className="inline mr-2 text-brand-primary" />Focus Session</h3>
            </div>
            {!focusSession ? (
              <div className="space-y-4">
                <p className="text-xs text-brand-text-dim">Start a focused study session in this room to track your productivity.</p>
                <button
                  onClick={() => onStartFocus(room.id, room.task)}
                  className="w-full py-3 bg-brand-text text-brand-bg rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all"
                >
                  Start Focus
                </button>
              </div>
            ) : (
              <div className="space-y-4 bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/20 animate-pulse">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Focusing Now...</span>
                  <div className="w-2 h-2 rounded-full bg-brand-danger"></div>
                </div>
                <button
                  onClick={onEndFocus}
                  className="w-full py-3 bg-brand-danger text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all"
                >
                  Stop Focus
                </button>
              </div>
            )}
          </div>

          <div className="bg-brand-surface rounded-2xl p-6 border border-brand-border">
            <h3 className="text-lg font-bold mb-4"><Users size={20} className="inline mr-2 text-brand-primary" />Members ({room.members.length})</h3>
            <div className="space-y-2">
              {(room.members || []).map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-brand-bg/50 rounded-lg border border-brand-border/30">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-sm transition-transform hover:scale-110 ${idx % 3 === 0 ? 'bg-brand-primary' : idx % 3 === 1 ? 'bg-brand-secondary' : 'bg-brand-tertiary'}`}>
                    {(member.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-brand-text">{member.name}</p>
                    <p className="text-xs text-brand-text-dim">{member.progress?.length || 0} tasks</p>
                  </div>
                  {member.id === currentUser.id && <span className="text-xs bg-brand-muted/40 text-brand-text px-2 py-1 rounded border border-brand-border">You</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col">
          <div className="bg-brand-card rounded-2xl p-1 mb-4 border border-brand-border flex overflow-x-auto no-scrollbar gap-0.5 sm:gap-2">
            {['chat', 'video', 'ai', 'progress'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 rounded-xl transition-all ${activeTab === tab ? 'bg-brand-text text-brand-bg shadow-lg' : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-surface/50'}`}
              >
                {tab === 'chat' && <MessageCircle size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'video' && <Video size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'ai' && <Bot size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'progress' && <TrendingUp size={16} className="sm:w-5 sm:h-5" />}
                <span className="font-bold text-[9px] sm:text-sm capitalize">
                  {tab === 'ai' ? 'AI Assistant' : tab}
                </span>
              </button>
            ))}
          </div>

          {activeTab === 'chat' && <ChatTab room={room} currentUser={currentUser} onSendMessage={onSendMessage} addToast={addToast} />}
          {activeTab === 'video' && <VideoTab room={room} onUpdateRoom={onUpdateRoom} />}
          {activeTab === 'ai' && <AITutorTab room={room} />}
          {activeTab === 'progress' && <ProgressTab room={room} currentUser={currentUser} currentMember={currentMember} onMarkProgress={onMarkProgress} />}
        </div>
      </div>
    </div>
  );
}

export default RoomView;
