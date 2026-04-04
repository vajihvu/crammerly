// src/components/HomeView.jsx
import React, { useState } from 'react';
import { Users, Plus, Trash2, EyeOff, Search } from 'lucide-react';
import { RoomGridSkeleton, NetworkError } from './ui/Skeletons';

function HomeView({ rooms, loadingRooms, roomsError, onRetryRooms, currentUser, onCreateRoom, onRoomClick, onDeleteRoom, onJoinByCode, onSearchClick, recentActivity = [] }) {
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeStatus, setActiveStatus] = useState('Active Now');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState('');

  const genres = ['All', 'IT', 'Law', 'Math', 'Medicine', 'Languages', 'Coding', 'Editing', 'Film Making', 'Design', 'Business', 'Quiet Study', 'Music', 'Game Dev', 'Architecture', 'Marketing', 'Exam Prep', 'Interview Prep', 'Reading', 'Brainstorming', 'Psychology', 'History'];

  const genreIcons = {
    'All': '✨',
    'IT': '</>',
    'Law': '⚖️',
    'Math': 'π',
    'Medicine': '⚕️',
    'Languages': 'A',
    'Coding': '⌨️',
    'Editing': '✍️',
    'Film Making': '🎥',
    'Design': '🎨',
    'Business': '📈',
    'Quiet Study': '🤫',
    'Music': '🎵',
    'Game Dev': '🎮',
    'Architecture': '🏛️',
    'Marketing': '🎯',
    'Exam Prep': '📝',
    'Interview Prep': '🤝',
    'Reading': '📚',
    'Brainstorming': '💡',
    'Psychology': '🧠',
    'History': '⏳'
  };

  const filteredGenres = genres.filter(g => g !== 'All' && g.toLowerCase().includes(genreSearch.toLowerCase()));
  const frequentlyVisited = recentActivity?.map(a => a.genre).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 2);
  if (frequentlyVisited.length < 2) {
      if (!frequentlyVisited.includes('Coding')) frequentlyVisited.push('Coding');
      if (!frequentlyVisited.includes('Math') && frequentlyVisited.length < 2) frequentlyVisited.push('Math');
  }

  const userInterests = currentUser.interests && currentUser.interests.length > 0
    ? currentUser.interests
    : ['General Study', 'Skill Building'];

  const statusTabs = ['Active Now', 'My Rooms', 'Scheduled'];

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const displayedRooms = (rooms || []).filter(room => {
    const topic = room.topic || '';
    const matchesGenre = activeGenre === 'All' || topic.toLowerCase().includes(activeGenre.toLowerCase());
    if (!matchesGenre) return false;

    const roomScheduleDate = room.scheduleDate || room.schedule_date || null;

    if (activeStatus === 'Active Now') {
      return !roomScheduleDate || roomScheduleDate === today;
    }
    if (activeStatus === 'My Rooms') {
      const isCreator = room.creator_id === currentUser.id;
      const isMember = room.members?.some(m => (m.id === currentUser.id || m.profile_id === currentUser.id));
      return isCreator || isMember;
    }
    if (activeStatus === 'Scheduled') {
      return roomScheduleDate && roomScheduleDate > today;
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mt-8 sm:mt-12 mb-4 sm:mb-6 pl-6 pr-4">
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-[1000] text-brand-text tracking-tighter uppercase leading-none">
            STUDY <span className="text-brand-primary">ROOMS</span>
          </h2>
          <button
            onClick={onSearchClick}
            className="p-2 sm:p-3 bg-brand-surface hover:bg-brand-card text-brand-text rounded-2xl border border-brand-border/50 shadow-sm transition-all hover:scale-110 active:scale-95 group shrink-0 sm:hidden"
            title="Search Rooms"
          >
            <Search size={22} className="text-brand-primary group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="flex flex-row gap-3 sm:gap-4 w-full lg:w-auto">
          <button
            onClick={onCreateRoom}
            className="flex-1 lg:flex-none flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-6 bg-brand-text hover:bg-brand-text/90 text-brand-bg rounded-2xl sm:rounded-[32px] shadow-2xl transition-all hover:-translate-y-1 active:scale-95 group border border-brand-border/10"
          >
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center transition-all group-hover:scale-110">
              <Plus size={16} strokeWidth={3} className="text-brand-primary sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] text-brand-bg transition-colors font-sans leading-none">CREATE ROOM</span>
          </button>

          <button
            onClick={onJoinByCode}
            className="flex-1 lg:flex-none flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-6 bg-brand-surface hover:bg-brand-card text-brand-text rounded-2xl sm:rounded-[32px] border border-brand-border/50 shadow-premium transition-all hover:-translate-y-1 active:scale-95 group"
          >
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center group-hover:bg-brand-primary group-hover:text-brand-bg transition-all">
              <Users size={16} strokeWidth={2.5} className="text-brand-primary group-hover:text-brand-bg sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[11px] font-[950] uppercase tracking-[0.1em] sm:tracking-[0.15em] transition-colors group-hover:text-brand-primary font-sans">Join by Code</span>
          </button>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-8 mt-2">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-1.5 h-6 bg-brand-primary rounded-full"></div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-text/60">Recently Visited</h4>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-2 -mx-2 px-2">
            {recentActivity.map((activity) => (
              <button
                key={activity.id}
                onClick={() => onRoomClick((rooms || []).find(r => r.id === activity.id) || activity)}
                className="flex-shrink-0 flex items-center gap-4 p-5 bg-brand-surface border border-brand-border/40 hover:border-brand-primary rounded-[28px] transition-all shadow-premium min-w-[240px] group text-left"
              >
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-brand-bg transition-all shrink-0">
                  <Users size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-brand-text truncate uppercase tracking-tight leading-none mb-1.5">{activity.title}</p>
                  <p className="text-[9px] font-bold text-brand-text-dim uppercase tracking-[0.15em] opacity-60">Go to {activity.genre || 'Room'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="w-full">
        <div className="space-y-8 flex flex-col w-full">
          {/* Genre / Category Filter Dropdown */}
          <div className="relative z-50">
            <button
              onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
              className="px-6 py-3 rounded-full text-sm font-black border transition-all uppercase tracking-wider font-sans whitespace-nowrap bg-brand-text border-brand-text text-brand-bg shadow-md scale-105 flex items-center gap-2"
            >
              {activeGenre === 'All' ? 'ALL GENRES' : activeGenre}
              <span className="text-[10px] ml-1">▼</span>
            </button>

            {isGenreDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsGenreDropdownOpen(false)}></div>
                <div className="absolute left-[105%] bottom-0 ml-2 w-[280px] sm:w-[320px] bg-brand-surface rounded-[24px] border border-brand-border/30 shadow-dropdown z-50 p-5 animate-in fade-in slide-in-from-left-2 slide-in-from-bottom-2 duration-200">
                  <div className="relative mb-5 border-b border-brand-border/30 pb-5">
                    <Search size={16} className="absolute left-3 top-3 text-brand-text-dim" />
                    <input 
                      type="text" 
                      placeholder="Type to filter genres..." 
                      className="w-full pl-10 pr-4 py-2.5 bg-brand-bg/50 rounded-xl text-sm font-bold text-brand-text placeholder:text-brand-text-dim focus:outline-none focus:ring-2 focus:ring-brand-primary/20 border border-brand-border/40"
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {frequentlyVisited.length > 0 && !genreSearch && (
                    <div className="mb-5 border-b border-brand-border/30 pb-5">
                      <h4 className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest mb-3">Frequently Visited</h4>
                      <div className="flex gap-2">
                        {frequentlyVisited.map(genre => (
                          <button
                            key={'freq-' + genre}
                            onClick={() => { setActiveGenre(genre); setIsGenreDropdownOpen(false); }}
                            className="flex-1 py-3 px-2 bg-brand-text hover:bg-black text-brand-bg rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 text-center"
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                     <h4 className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest mb-3">{genreSearch ? 'Search Results' : 'All Genres'}</h4>
                     <div className="max-h-[280px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                        {!genreSearch && (
                          <button
                            onClick={() => { setActiveGenre('All'); setIsGenreDropdownOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-brand-bg rounded-xl transition-all group"
                          >
                            <span className="w-8 text-center text-brand-text-dim font-black font-sans group-hover:text-brand-primary transition-colors">{genreIcons['All']}</span>
                            <span className="text-sm font-bold text-brand-text uppercase tracking-tight group-hover:text-brand-text transition-colors">ALL</span>
                          </button>
                        )}
                        {filteredGenres.map(genre => (
                           <button
                             key={genre}
                             onClick={() => { setActiveGenre(genre); setIsGenreDropdownOpen(false); }}
                             className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-brand-bg rounded-xl transition-all group"
                           >
                              <span className="w-8 text-center text-brand-text-dim font-black font-sans group-hover:text-brand-primary transition-colors">{genreIcons[genre] || '•'}</span>
                              <span className="text-sm font-bold text-brand-text uppercase tracking-tight group-hover:text-brand-text transition-colors">{genre}</span>
                           </button>
                        ))}
                        {filteredGenres.length === 0 && (
                          <div className="py-4 text-center text-xs font-bold text-brand-text-dim">No matching genres found.</div>
                        )}
                     </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            {/* Status Tabs & Count */}
            <div className="flex items-center justify-between border-b border-brand-border/10 w-full">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {statusTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveStatus(tab)}
                    className={`relative px-4 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-sm font-black transition-all font-sans whitespace-nowrap rounded-t-xl sm:rounded-t-2xl ${activeStatus === tab
                      ? 'text-brand-text bg-brand-text/[0.03]'
                      : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-text/[0.01]'
                      }`}
                  >
                    {tab}
                    {activeStatus === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] sm:h-[3px] bg-brand-primary animate-in fade-in slide-in-from-left-4 duration-500" />
                    )}
                  </button>
                ))}
              </div>
              <div className="hidden md:flex flex-1 items-center justify-center px-4 max-w-lg mx-auto">
                <button
                  onClick={onSearchClick}
                  className="w-full flex items-center gap-3 px-6 py-2.5 bg-brand-bg/80 border-2 border-brand-border rounded-full text-brand-text-dim hover:text-brand-text hover:border-brand-primary transition-all group text-left shadow-md"
                >
                  <Search size={16} className="text-brand-primary shrink-0 transition-transform group-hover:scale-110" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 transition-opacity">Search For Rooms</span>
                </button>
              </div>

              {displayedRooms.length > 0 && (
                <span className="hidden sm:block text-[10px] sm:text-xs font-black text-brand-primary uppercase tracking-widest pr-4 shrink-0">
                  {displayedRooms.length} {activeStatus}
                </span>
              )}
            </div>

            {loadingRooms ? (
              <RoomGridSkeleton count={6} />
            ) : roomsError ? (
              <NetworkError message={roomsError} onRetry={onRetryRooms} />
            ) : displayedRooms.length === 0 ? (
              <div className="bg-brand-card rounded-3xl p-12 text-center border-2 border-dashed border-brand-border flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-brand-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users size={40} className="text-brand-text-dim" />
                </div>
                <h3 className="text-2xl font-bold text-brand-text-dim mb-4 font-sans">No rooms here yet</h3>
                <p className="text-brand-muted max-w-sm mx-auto mb-8 font-sans">Why not start a new topic and invite others to join your session?</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {userInterests.map((interest, idx) => (
                    <button key={idx} onClick={onCreateRoom} className="px-6 py-3 bg-brand-muted/30 hover:bg-brand-muted/45 rounded-xl text-sm font-bold border border-brand-border transition-all text-brand-text">
                      Start {interest} Discussion
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedRooms.map(room => (
                  <div key={room.id} className="group bg-brand-surface rounded-[24px] p-6 border border-brand-border hover:border-brand-primary cursor-pointer overflow-hidden relative transition-all shadow-premium hover:-translate-y-1" onClick={() => onRoomClick(room)}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[50px] opacity-100 transition-all" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-secondary/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-all" />
                    <div className="flex justify-between items-start mb-6 relative">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse shadow-[0_0_10px_#798777]"></span>
                          <span className="text-[10px] font-black text-brand-success uppercase tracking-widest font-sans">Active Link</span>
                        </div>
                        <h3 className="text-xl font-bold text-brand-text group-hover:text-brand-primary transition-colors font-sans">{room.name}</h3>
                      </div>
                      <button onClick={(e) => onDeleteRoom(room, e)} className="p-2 hover:bg-brand-danger/20 rounded-xl transition-all relative z-10">
                        {room.creator_id === currentUser.id ? <Trash2 size={18} className="text-brand-danger" /> : <EyeOff size={18} className="text-brand-muted" />}
                      </button>
                    </div>
                    <div className="space-y-4 relative">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-brand-primary/15 rounded-lg text-[10px] font-black text-brand-primary uppercase tracking-widest font-sans">{room.topic}</span>
                        <span className="px-3 py-1 bg-brand-secondary/15 rounded-lg text-[10px] font-black text-brand-secondary uppercase tracking-widest font-sans">{room.privacy}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-brand-border/50">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => <div key={i} className={`w-7 h-7 rounded-full border-2 border-brand-surface bg-brand-card flex items-center justify-center text-[10px] font-black text-brand-secondary shadow-sm ${i === 2 ? 'bg-brand-bg' : i === 3 ? 'bg-brand-surface' : ''}`}>{room.name[0]}</div>)}
                        </div>
                        <span className="text-xs font-black text-brand-text-dim ml-1 uppercase tracking-tighter font-sans">{room.members.length} / 20</span>
                      </div>
                      <button className="px-6 py-2.5 bg-brand-text hover:bg-brand-text/90 text-brand-bg rounded-xl text-[10px] font-[1000] uppercase tracking-widest shadow-accent transition-all group-hover:scale-105 font-sans ring-1 ring-brand-primary/20">Join Room</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeView;
