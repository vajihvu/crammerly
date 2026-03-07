// src/components/RoomView.jsx
import React from 'react';
import { Users, Trash2, EyeOff, MessageCircle, Video, Bot, TrendingUp, ChevronLeft, Settings2, Check, X, Clock, ChevronDown } from 'lucide-react';

import ChatTab from './tabs/ChatTab';
import VideoTab from './tabs/VideoTab';
import AITutorTab from './tabs/AITutorTab';
import ProgressTab from './tabs/ProgressTab';

function RoomView({ room, currentUser, onMarkProgress, onDeleteRoom, onUpdateRoom, activeTab, setActiveTab, addToast }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedRoom, setEditedRoom] = React.useState(room || {});
  const [showRoomInfo, setShowRoomInfo] = React.useState(false);

  if (!room || !room.members) return null;

  const currentMember = (room.members || []).find(m => (m.id || m.profile_id) === currentUser.id);
  const isOwner = room.creator_id === currentUser.id;

  const handleUpdate = () => {
    onUpdateRoom(editedRoom);
    setIsEditing(false);
  };

  /* ─── Room Info Panel (shared between mobile toggle and desktop sidebar) ─── */
  const renderRoomInfoPanel = () => (
    <>
      <div className="bg-brand-card rounded-2xl p-4 border border-brand-border shadow-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 blur-3xl rounded-full"></div>
        <div className="flex justify-between items-start mb-2 relative z-10">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <input
                  type="text"
                  value={editedRoom.name}
                  onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
                  className="w-full bg-brand-bg border border-brand-primary/30 rounded-lg px-3 py-1 font-bold text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                  placeholder="Room Name"
                />
                <input
                  type="text"
                  value={editedRoom.task}
                  onChange={(e) => setEditedRoom({ ...editedRoom, task: e.target.value })}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1 text-xs text-brand-text focus:outline-none"
                  placeholder="Goal"
                />
                <input
                  type="text"
                  value={editedRoom.topic}
                  onChange={(e) => setEditedRoom({ ...editedRoom, topic: e.target.value })}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-1 text-xs text-brand-text focus:outline-none"
                  placeholder="Subject"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditedRoom({ ...editedRoom, privacy: 'Public' })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editedRoom.privacy === 'Public' ? 'bg-brand-text text-brand-bg shadow-sm' : 'bg-brand-muted/15 text-brand-text-dim hover:bg-brand-muted/30'}`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditedRoom({ ...editedRoom, privacy: 'Private' })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editedRoom.privacy === 'Private' ? 'bg-brand-text text-brand-bg shadow-sm' : 'bg-brand-muted/15 text-brand-text-dim hover:bg-brand-muted/30'}`}
                  >
                    Private
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleUpdate} className="flex-1 py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-accent hover:scale-105 transition-all"><Check size={14} /> Save</button>
                  <button onClick={() => { setIsEditing(false); setEditedRoom({ ...room }); }} className="flex-1 py-1.5 bg-brand-muted/20 text-brand-text-dim rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-muted/40 transition-all"><X size={14} /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1.5 text-brand-text truncate leading-tight">{room.name || 'Untitled Room'}</h2>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest min-w-[50px]">Goal:</span>
                    <p className="text-brand-text-dim text-xs truncate">{room.task || 'No goal set'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest min-w-[50px]">Topic:</span>
                    <p className="text-brand-text-dim text-xs truncate">{room.topic || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest min-w-[50px]">View:</span>
                    <p className="text-brand-text-dim text-xs truncate">{room.privacy || 'Public'}</p>
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary hover:text-brand-primary/80 transition-colors bg-brand-primary/5 px-3 py-1.5 rounded-xl border border-brand-primary/10"
                  >
                    <Settings2 size={12} /> Edit Settings
                  </button>
                )}
              </>
            )}
          </div>
          <button onClick={(e) => onDeleteRoom(room, e)} className="p-1.5 hover:bg-brand-muted/20 rounded-lg transition-all">
            {isOwner ? <Trash2 size={16} className="text-brand-danger" /> : <EyeOff size={16} className="text-brand-muted" />}
          </button>
        </div>
        {room.privacy === 'Private' && room.code && (
          <div className="bg-brand-bg rounded-lg p-2 border border-brand-primary/10 shadow-sm">
            <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">Room Code</p>
            <p className="font-mono text-lg font-black text-brand-text tracking-widest">{room.code}</p>
          </div>
        )}
      </div>

      <div className="bg-brand-surface rounded-2xl p-4 border border-brand-border shrink-0">
        <h3 className="text-sm font-bold mb-2"><Users size={16} className="inline mr-1.5 text-brand-primary" />Members ({room.members.length})</h3>
        <div className="space-y-1.5">
          {(room.members || []).map((member, idx) => (
            <div key={idx} className="flex items-center gap-2 p-1.5 bg-brand-bg/50 rounded-lg border border-brand-border/30">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm transition-transform hover:scale-110 ${idx % 3 === 0 ? 'bg-brand-primary' : idx % 3 === 1 ? 'bg-brand-secondary' : 'bg-brand-tertiary'}`}>
                {(member.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-brand-text truncate">{member.name}</p>
                <p className="text-[10px] text-brand-text-dim">{member.progress?.length || 0} tasks</p>
              </div>
              {member.id === currentUser.id && <span className="text-[10px] bg-brand-muted/40 text-brand-text px-1.5 py-0.5 rounded border border-brand-border">You</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Mobile: Collapsible room info toggle */}
      <div className="lg:hidden shrink-0 mb-2">
        <button
          onClick={() => setShowRoomInfo(!showRoomInfo)}
          className="w-full flex items-center justify-between px-4 py-3 bg-brand-card rounded-2xl border border-brand-border shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Users size={16} className="text-brand-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-brand-text truncate leading-tight">{room.name || 'Untitled Room'}</h3>
              <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">{room.members.length} members · {room.topic || 'General'}</p>
            </div>
          </div>
          <ChevronDown size={18} className={`text-brand-text-dim transition-transform duration-300 shrink-0 ${showRoomInfo ? 'rotate-180' : ''}`} />
        </button>

        {/* Collapsible room info on mobile */}
        <div className={`overflow-hidden transition-all duration-300 ${showRoomInfo ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-3">
            {renderRoomInfoPanel()}
          </div>
        </div>
      </div>

      {/* Main grid: sidebar hidden on mobile (shown via toggle above), visible on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar">
          {renderRoomInfoPanel()}
        </div>

        {/* Tab content */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="bg-brand-card rounded-2xl p-1 mb-3 border border-brand-border flex overflow-x-auto no-scrollbar gap-0.5 sm:gap-2 shrink-0">
            {['chat', 'video', 'ai', 'progress'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all ${activeTab === tab ? 'bg-brand-text text-brand-bg shadow-lg' : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-surface/50'}`}
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

          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'chat' && <ChatTab room={room} currentUser={currentUser} addToast={addToast} />}
            {activeTab === 'video' && <VideoTab room={room} onUpdateRoom={onUpdateRoom} />}
            {activeTab === 'ai' && <AITutorTab room={room} />}
            {activeTab === 'progress' && <ProgressTab room={room} currentUser={currentUser} currentMember={currentMember} onMarkProgress={onMarkProgress} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomView;

