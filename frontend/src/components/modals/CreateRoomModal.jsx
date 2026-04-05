// src/components/modals/CreateRoomModal.jsx
import React, { useState } from 'react';
import { Plus, X, ChevronDown, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const GENRES = ['IT', 'Law', 'Math', 'Medicine', 'Languages', 'Coding', 'Editing', 'Film Making', 'Design', 'Business', 'Quiet Study', 'Music', 'Game Dev', 'Architecture', 'Marketing', 'Exam Prep', 'Interview Prep', 'Reading', 'Brainstorming', 'Psychology', 'History'];

function CreateRoomModal({ onClose, onCreateRoom, addToast }) {
    const [name, setName] = useState('');
    const [task, setTask] = useState('');
    const [topic, setTopic] = useState('');
    const [privacy, setPrivacy] = useState('Public');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [isTopicOpen, setIsTopicOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isTimeOpen, setIsTimeOpen] = useState(false);

    // Mini Calendar Logic
    const [calDate, setCalDate] = useState(new Date());
    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const handleDateSelect = (day) => {
        const pad = (n) => n.toString().padStart(2, '0');
        const formattedDate = `${calDate.getFullYear()}-${pad(calDate.getMonth() + 1)}-${pad(day)}`;
        setScheduleDate(formattedDate);
        setIsDateOpen(false);
    };

    const handleCreate = () => {
        if (!name || !task || !topic) {
            if (addToast) addToast('Please fill all required fields', 'danger');
            return;
        }
        onCreateRoom(name, task, topic, privacy, scheduleDate, scheduleTime);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl z-[100]" aria-hidden="true"></div>
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[200]" onClick={onClose}>
                <div className="bg-brand-surface rounded-[24px] w-full max-w-sm border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden font-sans flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary/40 via-brand-text/10 to-brand-primary/40"></div>

                    {/* Header */}
                    <div className="px-5 sm:px-6 py-4 border-b border-brand-border/30 bg-brand-surface/50 backdrop-blur-xl flex items-center justify-between shrink-0 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-text text-brand-bg rounded-xl flex items-center justify-center shadow-lg">
                                <Plus size={16} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-brand-text uppercase tracking-tighter">NEW ROOM</h3>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 text-brand-text-dim hover:text-brand-danger hover:bg-brand-bg rounded-full transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="px-5 sm:px-6 pt-4 pb-5 space-y-3 flex-1 relative">
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
                        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-brand-secondary/5 blur-[80px] rounded-full pointer-events-none"></div>

                        <div className="space-y-3 relative z-10">
                            <div className="space-y-3">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Room Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-brand-bg border-[2px] border-brand-border/30 rounded-xl text-sm font-bold text-brand-text focus:border-brand-primary/50 focus:outline-none focus:bg-brand-card transition-all placeholder:text-brand-text/30 font-sans"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="My study goal..."
                                        value={task}
                                        onChange={(e) => setTask(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-brand-bg border-[2px] border-brand-border/30 rounded-xl text-sm font-bold text-brand-text focus:border-brand-primary/50 focus:outline-none focus:bg-brand-card transition-all placeholder:text-brand-text/30 font-sans"
                                    />

                                    {/* Custom Topic Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsTopicOpen(!isTopicOpen)}
                                            className="w-full px-4 py-2.5 bg-brand-bg border-[2px] border-brand-border/30 rounded-xl text-sm font-bold text-brand-text flex items-center justify-between hover:border-brand-primary/30 transition-all font-sans"
                                        >
                                            <span className={topic ? 'opacity-100' : 'opacity-40'}>{topic || 'Subject'}</span>
                                            <ChevronDown size={18} className={`transition-transform duration-300 ${isTopicOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {isTopicOpen && (
                                            <>
                                                <div className="fixed inset-0 z-[60]" onClick={() => setIsTopicOpen(false)}></div>
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-border/50 rounded-[24px] shadow-2xl z-[70] py-4 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {GENRES.map(g => (
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
                            <div className="pt-1">
                                <label className="text-[9px] font-black text-brand-text-dim uppercase tracking-[0.2em] block mb-2 pl-1">Who can join?</label>
                                <div className="bg-brand-bg p-1 rounded-xl border border-brand-border/30 grid grid-cols-2 gap-1">
                                    {['Public', 'Private'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setPrivacy(type)}
                                            className={`py-2 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${privacy === type
                                                ? 'bg-brand-text text-brand-bg shadow-md scale-[1.02]'
                                                : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-bg/50'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Schedule UI */}
                            <div className="pt-1">
                                <label className="text-[9px] font-black text-brand-text-dim uppercase tracking-[0.2em] block mb-2 pl-1">Start Time (Optional)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Custom Date Picker */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsDateOpen(!isDateOpen)}
                                            className="w-full px-3 py-2.5 bg-brand-bg border-[2px] border-brand-border/30 rounded-xl flex items-center gap-2 hover:border-brand-primary/30 transition-all font-sans"
                                        >
                                            <Calendar size={14} className="text-brand-primary shrink-0" />
                                            <span className={`text-xs font-bold ${scheduleDate ? 'text-brand-text' : 'text-brand-text/40'}`}>
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
                                                        {[...Array(firstDayOfMonth(calDate.getMonth(), calDate.getFullYear())).keys()].map(i => <div key={`empty-${i}`} />)}
                                                        {[...Array(daysInMonth(calDate.getMonth(), calDate.getFullYear())).keys()].map(i => {
                                                            const d = i + 1;
                                                            const padStr = (n) => n.toString().padStart(2, '0');
                                                            const cellDateStr = `${calDate.getFullYear()}-${padStr(calDate.getMonth() + 1)}-${padStr(d)}`;
                                                            const isSelected = scheduleDate === cellDateStr;
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
                                            className="w-full px-3 py-2.5 bg-brand-bg border-[2px] border-brand-border/30 rounded-xl flex items-center gap-2 hover:border-brand-primary/30 transition-all font-sans"
                                        >
                                            <Clock size={14} className="text-brand-primary shrink-0" />
                                            <span className={`text-xs font-bold ${scheduleTime ? 'text-brand-text' : 'text-brand-text/40'}`}>
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

                            <div className="flex items-center justify-between mt-4 gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 text-brand-text-dim font-black text-[10px] uppercase tracking-[0.2em] hover:text-brand-text transition-all text-center font-sans"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-[2] py-2.5 bg-brand-text text-brand-bg rounded-xl font-[1000] text-[10px] uppercase tracking-[0.1em] shadow-xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95 font-sans ring-2 ring-brand-bg"
                                >
                                    CREATE ROOM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CreateRoomModal;
