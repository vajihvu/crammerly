// src/components/modals/SearchRoomsModal.jsx
import React, { useState } from 'react';
import { X, Users, Search } from 'lucide-react';

function SearchRoomsModal({ rooms, onClose, onJoinRoom }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-6" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"></div>

      {/* Modal Content */}
      <div
        className="relative bg-brand-surface w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-[24px] sm:rounded-[40px] border border-brand-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-brand-border/50 flex flex-col shrink-0 bg-brand-surface/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-brand-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-brand-primary/20 shrink-0">
                <Users className="text-brand-primary w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-xl font-black text-brand-text uppercase tracking-tight truncate">Search Rooms</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-brand-text-dim hover:text-brand-text transition-all bg-brand-bg/50 hover:bg-brand-bg rounded-xl shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input Area */}
          <div className="relative group flex items-center">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-brand-text-dim group-focus-within:text-brand-primary transition-colors sm:w-[18px]" />
            </div>
            <input
              type="text"
              placeholder="Room name or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-20 sm:pr-28 py-3 bg-brand-bg border border-brand-border/50 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 text-sm sm:text-base text-brand-text placeholder:text-brand-text/30 transition-all font-bold"
            />
            <button className="absolute right-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-brand-primary text-brand-bg rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all active:scale-95 shadow-sm">
              <span className="hidden xs:inline">Search</span>
              <Search size={14} className="xs:hidden" />
            </button>
          </div>
        </div>

        {/* Search List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-muted/10 rounded-full flex items-center justify-center mb-4">
                <Search size={24} className="text-brand-text-dim/30 sm:w-[32px]" />
              </div>
              <p className="text-xs sm:text-sm font-black text-brand-text-dim uppercase tracking-widest px-4">
                {searchTerm ? `No results for "${searchTerm}"` : 'No Active Rooms Found'}
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-3">
              {filteredRooms.map(room => (
                <div
                  key={room.id}
                  className="bg-brand-bg/40 p-4 sm:p-5 rounded-2xl border border-brand-border/30 hover:border-brand-primary/50 transition-all group flex items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-brand-text truncate group-hover:text-brand-primary transition-colors text-sm sm:text-lg">{room.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="px-2 py-0.5 bg-brand-primary/10 rounded-md text-[8px] sm:text-[9px] font-black text-brand-primary uppercase tracking-wider shrink-0">{room.topic}</span>
                      <span className="text-[10px] text-brand-text-dim font-bold flex items-center gap-1 shrink-0">
                        <Users size={12} className="text-brand-primary/60" /> {room.members.length}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinRoom(room)}
                    className="shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 bg-brand-text hover:bg-black text-brand-bg rounded-lg sm:rounded-xl font-[1000] text-[9px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchRoomsModal;