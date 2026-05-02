// src/components/RoomView.jsx
import React from 'react';
import { Users, Trash2, EyeOff, MessageCircle, Video, Bot, TrendingUp, ChevronLeft, Settings2, Check, X, Clock, ChevronDown, Link2, Shield, LogOut, LayoutGrid, BookOpen } from 'lucide-react';
import { roomsApi } from '../api/rooms';
import { tasksApi } from '../api/tasks';

import ChatTab from './tabs/ChatTab';
import VideoTab from './tabs/VideoTab';
import AITutorTab from './tabs/AITutorTab';
import ProgressTab from './tabs/ProgressTab';
import BoardTab from './tabs/BoardTab';
import LibraryTab from './tabs/LibraryTab';

function RoomView({ room, currentUser, onMarkProgress, onDeleteRoom, onUpdateRoom, activeTab, setActiveTab, addToast }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedRoom, setEditedRoom] = React.useState(room || {});
  const [showRoomInfo, setShowRoomInfo] = React.useState(false);
  const [isMembersExpanded, setIsMembersExpanded] = React.useState(false);
  const [linkCopied, setLinkCopied] = React.useState(false);
  const [addingAdmin, setAddingAdmin] = React.useState(null);
  const [editingRole, setEditingRole] = React.useState(null);

  if (!room || !room.members) return null;

  const currentMember = (room.members || []).find(m => (m.id || m.profile_id) === currentUser.id);
  const isOwner = room.creatorId === currentUser.id;
  const isProject = room.roomType === 'Project';

  const PROJECT_ROLES = ['Editor', 'Presenter', 'Researcher', 'Designer', 'Developer', 'Writer', 'Lead', 'Tester'];

  const handleAssignRole = async (memberId, role) => {
    try {
      await tasksApi.assignRole(room.id, memberId, role);
      // Update local state
      const mem = room.members.find(m => m.id === memberId);
      if (mem) mem.role = role;
      setEditingRole(null);
      if (addToast) addToast('Role updated!', 'success');
    } catch (e) {
      if (addToast) addToast(e.response?.data?.message || 'Failed to assign role', 'error');
    }
  };

  const handleToggleAdmin = async (memberId) => {
    setAddingAdmin(memberId);
    try {
      await roomsApi.toggleAdmin(room.id, memberId);
      if (addToast) addToast("Admin status updated!", "success");
      const mem = room.members.find(m => m.id === memberId);
      if (mem) mem.isAdmin = !mem.isAdmin;
    } catch (e) {
      if (addToast) addToast(e.response?.data?.message || "Failed to change admin status.", "error");
    } finally {
      setAddingAdmin(null);
    }
  };

  const handleUpdate = () => {
    onUpdateRoom(editedRoom);
    setIsEditing(false);
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/invite/${room.id}`;
    navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true);
      if (addToast) addToast('Invite link copied!', 'success');
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(() => {
      if (addToast) addToast('Failed to copy link', 'error');
    });
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
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editedRoom.privacy === 'Public' ? 'bg-brand-primary text-brand-bg shadow-sm' : 'bg-brand-muted/15 text-brand-text-dim hover:bg-brand-muted/30'}`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditedRoom({ ...editedRoom, privacy: 'Private' })}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${editedRoom.privacy === 'Private' ? 'bg-brand-primary text-brand-bg shadow-sm' : 'bg-brand-muted/15 text-brand-text-dim hover:bg-brand-muted/30'}`}
                  >
                    Private
                  </button>
                </div>
                <div className="flex gap-2 pt-1">
                   <button onClick={handleUpdate} className="flex-1 py-1.5 bg-brand-primary text-brand-bg rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-accent hover:scale-105 transition-all"><Check size={14} /> Save</button>
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
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isOwner && !isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="p-1.5 hover:bg-brand-primary/10 rounded-lg transition-all" 
                title="Edit Room"
              >
                <Settings2 size={16} className="text-brand-primary" />
              </button>
            )}
            {isOwner && !isEditing && (
              <button 
                onClick={copyInviteLink} 
                className="p-1.5 hover:bg-brand-primary/10 rounded-lg transition-all" 
                title="Copy Invite Link"
              >
                <Link2 size={16} className={linkCopied ? "text-green-500" : "text-brand-primary"} />
              </button>
            )}
            {isOwner && (
              <button 
                onClick={(e) => onDeleteRoom(room, e)} 
                className="p-1.5 hover:bg-brand-danger/10 rounded-lg transition-all group" 
                title="Delete Room"
              >
                <Trash2 size={16} className="text-brand-danger" />
              </button>
            )}
            {!isOwner && (
              <button 
                onClick={(e) => onDeleteRoom(room, e)} 
                className="p-1.5 hover:bg-brand-danger/10 rounded-lg transition-all group" 
                title="Leave Room Permanently"
              >
                <LogOut size={16} className="text-brand-danger" />
              </button>
            )}
          </div>

        </div>
        {room.privacy === 'Private' && room.code && (
          <div className="bg-brand-bg rounded-lg p-2 border border-brand-primary/10 shadow-sm">
            <p className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">Room Code</p>
            <p className="font-mono text-lg font-black text-brand-text tracking-widest">{room.code}</p>
          </div>
        )}
        {isOwner && (
          <button
            onClick={copyInviteLink}
            className={`w-full mt-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all border ${
              linkCopied 
                ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20'
            }`}
          >
            <Link2 size={14} />
            {linkCopied ? 'Link Copied!' : 'Copy Invite Link'}
          </button>
        )}
      </div>

      <div className="bg-brand-surface rounded-2xl p-4 border border-brand-border shrink-0">
        <button 
          onClick={() => setIsMembersExpanded(!isMembersExpanded)}
          className="w-full flex items-center justify-between group"
        >
          <h3 className="text-sm font-bold flex items-center gap-1.5 transition-colors group-hover:text-brand-primary">
            <Users size={16} className="text-brand-primary" />
            Members ({room.members.length})
          </h3>
          <ChevronDown 
            size={18} 
            className={`text-brand-text-dim transition-transform duration-300 ${isMembersExpanded ? 'rotate-180' : ''}`} 
          />
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${isMembersExpanded ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-1.5">
            {(room.members || []).filter(m => m.id).map((member, idx) => {
              const isCreator = member.id === room.creatorId;
              const isAdmin = member.isAdmin && !isCreator;
              return (
                <div key={idx} className="flex items-center gap-2 p-1.5 bg-brand-bg/50 rounded-lg border border-brand-border/30">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-sm transition-transform hover:scale-110 ${idx % 3 === 0 ? 'bg-brand-primary' : idx % 3 === 1 ? 'bg-brand-secondary' : 'bg-brand-tertiary'}`}>
                    {(member.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs text-brand-text truncate">{member.name}</p>
                    {isProject && member.role ? (
                      <p className="text-[9px] font-black uppercase tracking-wider text-brand-primary">{member.role}</p>
                    ) : (
                      <p className="text-[10px] text-brand-text-dim">{member.progress?.length || 0} tasks</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCreator && <span className="text-[9px] bg-brand-primary text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase border border-brand-primary">Owner</span>}
                    {isAdmin && <span className="text-[9px] bg-brand-secondary text-white px-1.5 py-0.5 rounded font-black tracking-wider uppercase border border-brand-secondary">Admin</span>}
                    {member.id === currentUser.id && <span className="text-[10px] bg-brand-muted/40 text-brand-text px-1.5 py-0.5 rounded border border-brand-border">You</span>}
                    {isOwner && member.id !== currentUser.id && !isProject && (
                      <button onClick={() => handleToggleAdmin(member.id)} title={member.isAdmin ? "Remove Admin" : "Make Admin"} className={`p-1 rounded transition-all ${member.isAdmin ? 'text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20' : 'text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10'}`}>
                        <Shield size={14} className={addingAdmin === member.id ? "animate-pulse" : ""} />
                      </button>
                    )}
                    {isProject && isOwner && member.id !== currentUser.id && (
                      <div className="relative">
                        <button onClick={() => setEditingRole(editingRole === member.id ? null : member.id)} className="p-1 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-primary/10 transition-all" title="Assign Role">
                          <Shield size={14} />
                        </button>
                        {editingRole === member.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setEditingRole(null)} />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-brand-surface border border-brand-border rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
                              {PROJECT_ROLES.map(r => (
                                <button key={r} onClick={() => handleAssignRole(member.id, r)} className={`w-full px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-wider transition-all hover:bg-brand-primary/10 ${member.role === r ? 'text-brand-primary' : 'text-brand-text-dim hover:text-brand-primary'}`}>{r}</button>
                              ))}
                              {member.role && <button onClick={() => handleAssignRole(member.id, '')} className="w-full px-3 py-1.5 text-left text-[10px] font-black uppercase tracking-wider text-red-400 hover:bg-red-500/10">Clear Role</button>}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar">
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
            {(isProject ? ['chat', 'board', 'library', 'video', 'ai'] : ['chat', 'video', 'ai', 'progress']).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                 className={`flex-1 min-w-[60px] sm:min-w-[80px] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl transition-all ${activeTab === tab ? 'bg-brand-primary text-brand-bg shadow-lg' : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-surface/50'}`}
              >
                {tab === 'chat' && <MessageCircle size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'board' && <LayoutGrid size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'library' && <BookOpen size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'video' && <Video size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'ai' && <Bot size={16} className="sm:w-5 sm:h-5" />}
                {tab === 'progress' && <TrendingUp size={16} className="sm:w-5 sm:h-5" />}
                <span className="font-bold text-[9px] sm:text-sm capitalize">
                  {tab === 'ai' ? 'AI' : tab === 'board' ? 'Board' : tab === 'library' ? 'Library' : tab}
                </span>
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'chat' && <ChatTab room={room} currentUser={currentUser} addToast={addToast} />}
            {activeTab === 'board' && <BoardTab room={room} currentUser={currentUser} addToast={addToast} />}
            {activeTab === 'library' && <LibraryTab room={room} currentUser={currentUser} addToast={addToast} />}
            {activeTab === 'video' && <VideoTab room={room} currentUser={currentUser} addToast={addToast} onUpdateRoom={onUpdateRoom} />}
            {activeTab === 'ai' && <AITutorTab room={room} />}
            {activeTab === 'progress' && <ProgressTab room={room} currentUser={currentUser} currentMember={currentMember} onMarkProgress={onMarkProgress} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomView;

