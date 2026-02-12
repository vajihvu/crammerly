// src/components/HomeView.jsx
import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, EyeOff, Search, ChevronDown, Calendar, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';

function HomeView({ rooms, currentUser, onCreateRoom, onRoomClick, onDeleteRoom, onJoinByCode, onSearchClick, recentActivity = [], addToast }) {
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (showCreate) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showCreate]);
  const [name, setName] = useState('');
  const [task, setTask] = useState('');
  const [topic, setTopic] = useState('');
  const [privacy, setPrivacy] = useState('Public');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeStatus, setActiveStatus] = useState('Active Now');
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  // Mini Calendar Logic
  const [calDate, setCalDate] = useState(new Date());
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day) => {
    const selected = new Date(calDate.getFullYear(), calDate.getMonth(), day);
    setScheduleDate(selected.toISOString().split('T')[0]);
    setIsDateOpen(false);
  };

  const handleCreate = () => {
    if (!name || !task || !topic) {
      if (addToast) {
        addToast('Please fill all required fields', 'danger');
      }
      return;
    }
    onCreateRoom(name, task, topic, privacy, scheduleDate, scheduleTime);
    setShowCreate(false);
    setName(''); setTask(''); setTopic('');
    setPrivacy('Public'); setScheduleDate(''); setScheduleTime('');
  };

  const genres = ['All', 'IT', 'Law', 'Math', 'Medicine', 'Languages', 'Coding', 'Editing', 'Film Making', 'Design', 'Business', 'Quiet Study'];

  const userInterests = currentUser.interests && currentUser.interests.length > 0
    ? currentUser.interests
    : ['General Study', 'Skill Building'];


  const statusTabs = ['Active Now', 'My Rooms', 'Scheduled'];

  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const displayedRooms = (rooms || []).filter(room => {
    // 1. Genre Filter
    const topic = room.topic || '';
    const matchesGenre = activeGenre === 'All' || topic.toLowerCase().includes(activeGenre.toLowerCase());
    if (!matchesGenre) return false;

    // 2. Status/Date Filter
    const roomScheduleDate = room.scheduleDate || room.schedule_date || null;

    if (activeStatus === 'Active Now') {
      // Room is active now if it has no date or the date is today
      return !roomScheduleDate || roomScheduleDate === today;
    }

    if (activeStatus === 'My Rooms') {
      // Robust check for creator or member (handles DB sync lag)
      const isCreator = room.creator_id === currentUser.id;
      const isMember = room.members?.some(m => (m.id === currentUser.id || m.profile_id === currentUser.id));
      return isCreator || isMember;
    }

    if (activeStatus === 'Scheduled') {
      // Room is scheduled if it's in the future
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
            onClick={() => setShowCreate(true)}
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

        {/* Rooms Listing Column */}
        <div className="space-y-8 flex flex-col w-full">
          {/* Genre / Category Filter */}
          <div className="flex overflow-x-auto gap-3 p-2 -m-2 no-scrollbar pb-4 lg:flex-wrap lg:overflow-visible">
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black border transition-all uppercase tracking-wider font-sans whitespace-nowrap ${activeGenre === genre
                  ? 'bg-brand-text border-brand-text text-brand-bg shadow-md scale-105'
                  : 'bg-brand-surface border-brand-border text-brand-text hover:border-brand-primary hover:text-brand-primary shadow-sm'
                  }`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            {/* Premium Status Tabs & Count */}
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


            {displayedRooms.length === 0 ? (
              <div className="bg-brand-card rounded-3xl p-12 text-center border-2 border-dashed border-brand-border flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-brand-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users size={40} className="text-brand-text-dim" />
                </div>
                <h3 className="text-2xl font-bold text-brand-text-dim mb-4 font-sans">No rooms here yet</h3>
                <p className="text-brand-muted max-w-sm mx-auto mb-8 font-sans">Why not start a new topic and invite others to join your session?</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {userInterests.map((interest, idx) => (
                    <button key={idx} onClick={() => setShowCreate(true)} className="px-6 py-3 bg-brand-muted/30 hover:bg-brand-muted/45 rounded-xl text-sm font-bold border border-brand-border transition-all text-brand-text">
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

      {showCreate && (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-4 z-[100] overflow-y-auto" onClick={() => setShowCreate(false)}>
          <div className="bg-brand-surface rounded-[40px] w-full max-w-[480px] max-h-[calc(100vh-120px)] border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden font-sans flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary/40 via-brand-text/10 to-brand-primary/40"></div>

            {/* Standard Premium Header */}
            <div className="px-6 sm:px-10 py-6 border-b border-brand-border/30 bg-brand-surface/50 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-text text-brand-bg rounded-2xl flex items-center justify-center shadow-lg">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-[1000] text-brand-text uppercase tracking-tighter">NEW ROOM</h3>
                </div>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 sm:p-3 text-brand-text-dim hover:text-brand-danger hover:bg-brand-bg rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="px-6 sm:px-10 pt-4 sm:pt-6 pb-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar relative">
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand-secondary/5 blur-[80px] rounded-full pointer-events-none"></div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-4">
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Room Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-6 py-4 bg-brand-bg border-[2px] border-brand-border/30 rounded-[24px] text-[15px] font-bold text-brand-text focus:border-brand-primary/50 focus:outline-none focus:bg-brand-card transition-all placeholder:text-brand-text/30 font-sans"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="My study goal..."
                      value={task}
                      onChange={(e) => setTask(e.target.value)}
                      className="w-full px-6 py-4 bg-brand-bg border-[2px] border-brand-border/30 rounded-[24px] text-[15px] font-bold text-brand-text focus:border-brand-primary/50 focus:outline-none focus:bg-brand-card transition-all placeholder:text-brand-text/30 font-sans"
                    />

                    {/* Custom Topic Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsTopicOpen(!isTopicOpen)}
                        className="w-full px-6 py-4 bg-brand-bg border-[2px] border-brand-border/30 rounded-[24px] text-[15px] font-bold text-brand-text flex items-center justify-between hover:border-brand-primary/30 transition-all font-sans"
                      >
                        <span className={topic ? 'opacity-100' : 'opacity-40'}>{topic || 'Subject'}</span>
                        <ChevronDown size={18} className={`transition-transform duration-300 ${isTopicOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isTopicOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsTopicOpen(false)}></div>
                          <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-border/50 rounded-[24px] shadow-2xl z-[70] py-4 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                            {genres.filter(g => g !== 'All').map(g => (
                              <button
                                key={g}
                                onClick={() => { setTopic(g); setIsTopicOpen(false); }}
                                className={`w-full px-6 py-3 text-left text-[13px] font-black uppercase tracking-widest transition-colors hover:bg-brand-primary/10 ${topic === g ? 'text-brand-primary bg-brand-primary/5' : 'text-brand-text-dim hover:text-brand-primary'}`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Privacy Toggle */}
                <div className="pt-2">
                  <label className="text-[10px] font-black text-brand-text-dim uppercase tracking-[0.3em] block mb-3 pl-2">Who can join?</label>
                  <div className="bg-brand-bg p-1.5 rounded-[22px] border border-brand-border/30 grid grid-cols-2 gap-1.5">
                    {['Public', 'Private'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPrivacy(type)}
                        className={`py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${privacy === type
                          ? 'bg-brand-text text-brand-bg shadow-lg scale-[1.02]'
                          : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-bg/50'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Schedule UI */}
                <div className="pt-2">
                  <label className="text-[10px] font-black text-brand-text-dim uppercase tracking-[0.3em] block mb-3 pl-2">Start Time (Optional)</label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Custom Date Picker */}
                    <div className="relative">
                      <button
                        onClick={() => setIsDateOpen(!isDateOpen)}
                        className="w-full px-5 py-4 bg-brand-bg border-[2px] border-brand-border/30 rounded-[24px] flex items-center gap-3 hover:border-brand-primary/30 transition-all font-sans"
                      >
                        <Calendar size={18} className="text-brand-primary shrink-0" />
                        <span className={`text-[13px] font-bold ${scheduleDate ? 'text-brand-text' : 'text-brand-text/40'}`}>
                          {scheduleDate ? new Date(scheduleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Select Date'}
                        </span>
                      </button>

                      {isDateOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsDateOpen(false)}></div>
                          <div className="absolute bottom-full mb-4 left-0 right-[-40px] md:right-0 bg-brand-surface border border-brand-border shadow-2xl z-[70] rounded-[32px] p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-4 px-2">
                              <h4 className="text-[11px] font-[900] uppercase tracking-[0.2em] text-brand-text">
                                {calDate.toLocaleString('default', { month: 'long' })} {calDate.getFullYear()}
                              </h4>
                              <div className="flex gap-1">
                                <button onClick={() => setCalDate(new Date(calDate.setMonth(calDate.getMonth() - 1)))} className="p-1.5 hover:bg-brand-bg rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                                <button onClick={() => setCalDate(new Date(calDate.setMonth(calDate.getMonth() + 1)))} className="p-1.5 hover:bg-brand-bg rounded-lg transition-colors"><ChevronRight size={16} /></button>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 text-center gap-1">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-[9px] font-black text-brand-primary/40 pb-2">{d}</span>)}
                              {Array.from({ length: firstDayOfMonth(calDate.getMonth(), calDate.getFullYear()) }).map((_, i) => <div key={i} />)}
                              {Array.from({ length: daysInMonth(calDate.getMonth(), calDate.getFullYear()) }).map((_, i) => {
                                const d = i + 1;
                                const isSelected = scheduleDate === new Date(calDate.getFullYear(), calDate.getMonth(), d).toISOString().split('T')[0];
                                return (
                                  <button
                                    key={d}
                                    onClick={() => handleDateSelect(d)}
                                    className={`w-8 h-8 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center ${isSelected ? 'bg-brand-primary text-brand-bg shadow-accent' : 'hover:bg-brand-bg text-brand-text'}`}
                                  >
                                    {d}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Custom Time Picker */}
                    <div className="relative">
                      <button
                        onClick={() => setIsTimeOpen(!isTimeOpen)}
                        className="w-full px-5 py-4 bg-brand-bg border-[2px] border-brand-border/30 rounded-[24px] flex items-center gap-3 hover:border-brand-primary/30 transition-all font-sans"
                      >
                        <Clock size={18} className="text-brand-primary shrink-0" />
                        <span className={`text-[13px] font-bold ${scheduleTime ? 'text-brand-text' : 'text-brand-text/40'}`}>
                          {scheduleTime || 'Select Time'}
                        </span>
                      </button>

                      {isTimeOpen && (
                        <>
                          <div className="fixed inset-0 z-[60]" onClick={() => setIsTimeOpen(false)}></div>
                          <div className="absolute bottom-full mb-4 right-0 w-48 bg-brand-surface border border-brand-border shadow-2xl z-[70] rounded-[32px] p-4 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {[
                              '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
                              '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
                            ].map(t => (
                              <button
                                key={t}
                                onClick={() => { setScheduleTime(t); setIsTimeOpen(false); }}
                                className={`w-full px-4 py-2.5 text-left text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${scheduleTime === t ? 'text-brand-primary bg-brand-primary/5' : 'text-brand-text-dim hover:text-brand-primary hover:bg-brand-bg'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-10 pt-4 gap-4">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-4 text-brand-text-dim font-black text-[11px] uppercase tracking-[0.25em] hover:text-brand-text transition-all text-center font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex-[2] py-4 bg-brand-text text-brand-bg rounded-[24px] font-[1000] text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95 font-sans ring-4 ring-brand-bg"
                  >
                    CREATE ROOM
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeView;