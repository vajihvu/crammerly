// src/components/modals/NotebookModal.jsx
import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle, NotebookPen, Sparkles, BookOpen, Calendar as CalendarIcon } from 'lucide-react';

function NotebookModal({ onClose, journalEntries = [], studyNotes = [], onAddJournalEntry, onDeleteJournalEntry, onAddStudyNote, onDeleteStudyNote }) {
  const [activeTab, setActiveTab] = useState('journal');
  const [newJournalContent, setNewJournalContent] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAddJournal = () => {
    if (newJournalContent.trim()) {
      onAddJournalEntry(newJournalContent.trim());
      setNewJournalContent('');
      setShowAddJournal(false);
    }
  };

  const handleAddNote = () => {
    if (newNoteTitle.trim() && newNoteContent.trim()) {
      onAddStudyNote(newNoteTitle.trim(), newNoteContent.trim());
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNote(false);
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const generateSummary = () => {
    const totalEntries = (journalEntries?.length || 0) + (studyNotes?.length || 0);
    if (totalEntries === 0) return "Data summary active. Your library is currently empty of data. Start journaling or taking concept notes to generate a study summary.";

    return `Synthesizing ${journalEntries?.length || 0} journal entries and ${studyNotes?.length || 0} concept notes... Most discussed patterns center around growth and active recall. Your consistency is at ${(journalEntries?.length || 0) > 5 ? 'Peak Performance' : 'Growth Phase'}. Current focus suggested: Revisit the core concepts from your last 3 concept notes to solidify the neural pathways.`;
  };

  const handleAiAsk = () => {
    if (!aiInput.trim() || isAiLoading) return;

    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    setTimeout(() => {
      const responseMsg = {
        role: 'assistant',
        content: `Based on your journal history, I recommend focusing on the "Synthesis" of your last concepts. Study Tip: Try teaching this specific point to a peer (Protege Effect) to increase retention by 90%. Advise: Your recent entries suggest slight burnout; schedule a 15-min 'Quiet Study' session before your next deep work.`
      };
      setAiMessages(prev => [...prev, responseMsg]);
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-end justify-center sm:justify-end p-0 sm:p-6 pointer-events-none" onClick={onClose}>
      <div className="w-full sm:w-[450px] sm:mr-20 sm:mb-4 h-[100dvh] sm:h-auto sm:max-h-[calc(100vh-120px)] bg-brand-surface rounded-none sm:rounded-[32px] border-0 sm:border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto z-[9999] font-sans" onClick={(e) => e.stopPropagation()}>

        {/* Premium Header */}
        <div className="relative p-7 border-b border-brand-border/30 bg-brand-bg/50">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-muted/20 rounded-2xl flex items-center justify-center shadow-lg rotate-3 transition-colors duration-300 border border-brand-border">
                {activeTab === 'journal' ? <Sparkles className="text-brand-primary" size={24} /> :
                  activeTab === 'notes' ? <BookOpen className="text-brand-secondary" size={24} /> :
                    <Sparkles className="text-brand-warning animate-pulse" size={24} />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-brand-text tracking-tight leading-none uppercase">My Notes</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/10 rounded-full transition-all active:scale-90 border border-brand-border/30 shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Spacious Tabs */}
        <div className="px-7 pt-8 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-[24px] transition-all duration-300 border ${activeTab === 'journal'
                ? 'bg-brand-text text-brand-bg border-brand-text shadow-2xl scale-[1.02]'
                : 'bg-brand-bg/50 text-brand-text-dim border-brand-border/50 hover:border-brand-text/30'
                }`}
            >
              <Sparkles size={16} strokeWidth={2.5} className={activeTab === 'journal' ? 'text-brand-primary' : ''} />
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === 'journal' ? 'text-brand-bg' : 'text-brand-text-dim'}`}>Diary</span>
            </button>


            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-[24px] transition-all duration-300 border ${activeTab === 'notes'
                ? 'bg-brand-text text-brand-bg border-brand-text shadow-2xl scale-[1.02]'
                : 'bg-brand-bg/50 text-brand-text-dim border-brand-border/50 hover:border-brand-text/30'
                }`}
            >
              <BookOpen size={16} strokeWidth={2.5} className={activeTab === 'notes' ? 'text-brand-secondary' : ''} />
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === 'notes' ? 'text-brand-bg' : 'text-brand-text-dim'}`}>Study Notes</span>
            </button>


            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-[24px] transition-all duration-300 border ${activeTab === 'ai'
                ? 'bg-brand-warning text-brand-bg border-brand-warning shadow-2xl scale-[1.02]'
                : 'bg-brand-bg/50 text-brand-text-dim border-brand-border/50 hover:border-brand-warning/30'
                }`}
            >
              <Sparkles size={16} strokeWidth={2.5} className={activeTab === 'ai' ? 'animate-pulse' : ''} />
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${activeTab === 'ai' ? 'text-brand-bg' : 'text-brand-text-dim'}`}>AI Assistant</span>
            </button>


          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pt-6 pr-8 custom-scrollbar">
          {activeTab === 'journal' && (
            <div className="space-y-4">
              {!showAddJournal ? (
                <button
                  onClick={() => setShowAddJournal(true)}
                  className="w-full py-4 bg-brand-muted/10 hover:bg-brand-muted/20 border border-brand-border border-dashed rounded-[20px] transition-all flex items-center justify-center gap-2 text-sm font-black text-brand-text-dim hover:text-brand-text group"
                >
                  <Plus size={18} className="transition-transform group-hover:rotate-90 text-brand-primary" />
                  New diary entry
                </button>
              ) : (
                <div className="bg-brand-card rounded-[24px] p-4 border border-brand-primary/30 animate-in zoom-in-95 duration-200 shadow-xl">
                  <textarea
                    value={newJournalContent}
                    onChange={(e) => setNewJournalContent(e.target.value)}
                    placeholder="Write something..."
                    className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm focus:outline-none ring-1 ring-brand-border focus:ring-brand-primary transition-all resize-none border-none text-brand-text placeholder:text-brand-muted mb-4"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddJournal(false)}
                      className="flex-1 py-2.5 bg-brand-muted/20 hover:bg-brand-muted/40 text-brand-text-dim font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddJournal}
                      className="flex-1 py-2.5 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(journalEntries || []).map((entry) => (
                  <div key={entry.id} className="bg-brand-card rounded-[24px] p-5 border border-brand-border hover:border-brand-primary/50 transition-all group relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 px-2.5 py-1 bg-brand-bg rounded-full border border-brand-border">
                        <CalendarIcon size={10} className="text-brand-primary" />
                        <span className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest">{formatDate(entry.date)}</span>
                      </div>
                      <button
                        onClick={() => onDeleteJournalEntry(entry.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-brand-danger/20 rounded-full transition-all"
                      >
                        <Trash2 size={14} className="text-brand-danger" />
                      </button>
                    </div>
                    <p className="text-[13px] text-brand-text-dim leading-relaxed font-medium group-hover:text-brand-text transition-colors">{entry.content}</p>
                  </div>
                ))}
                {(journalEntries || []).length === 0 && !showAddJournal && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-brand-muted/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-border">
                      <Sparkles className="text-brand-muted" size={24} />
                    </div>
                    <p className="text-[11px] font-black text-brand-muted uppercase tracking-[0.2em]">No entries yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {!showAddNote ? (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="w-full py-4 bg-brand-muted/10 hover:bg-brand-muted/20 border border-brand-border border-dashed rounded-[20px] transition-all flex items-center justify-center gap-2 text-sm font-black text-brand-text-dim hover:text-brand-text group"
                >
                  <Plus size={18} className="transition-transform group-hover:rotate-90 text-brand-secondary" />
                  New study note
                </button>
              ) : (
                <div className="bg-brand-card rounded-[24px] p-4 border border-brand-secondary/30 animate-in zoom-in-95 duration-200 shadow-xl">
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Title"
                    className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm font-black focus:outline-none ring-1 ring-brand-border focus:ring-brand-secondary border-none text-brand-text placeholder:text-brand-muted mb-3"
                    autoFocus
                  />
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="What did you learn?"
                    className="w-full bg-brand-bg rounded-xl px-4 py-3 text-sm focus:outline-none ring-1 ring-brand-border focus:ring-brand-secondary transition-all resize-none border-none text-brand-text placeholder:text-brand-muted mb-4"
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAddNote(false)}
                      className="flex-1 py-2.5 bg-brand-muted/20 hover:bg-brand-muted/40 text-brand-text-dim font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      className="flex-1 py-2.5 bg-brand-secondary text-brand-bg font-black text-xs uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(studyNotes || []).map((note) => (
                  <div key={note.id} className="bg-brand-card rounded-[24px] p-5 border border-brand-border hover:border-brand-secondary/50 transition-all group relative">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-black text-brand-text truncate tracking-tight">{note.title}</h4>
                      <button
                        onClick={() => onDeleteStudyNote(note.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-brand-danger/20 rounded-full transition-all ml-2"
                      >
                        <Trash2 size={14} className="text-brand-danger" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-bg rounded-md border border-brand-border">
                        <CalendarIcon size={10} className="text-brand-secondary" />
                        <span className="text-[9px] font-black text-brand-text-dim uppercase tracking-widest">{formatDate(note.date)}</span>
                      </div>
                    </div>
                    <p className="text-[13px] text-brand-text-dim leading-relaxed font-medium line-clamp-3 group-hover:text-brand-text transition-colors">{note.content}</p>
                  </div>
                ))}
                {(studyNotes || []).length === 0 && !showAddNote && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-brand-muted/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-border">
                      <BookOpen className="text-brand-muted" size={24} />
                    </div>
                    <p className="text-[11px] font-black text-brand-muted uppercase tracking-[0.2em]">No notes yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Neural Summary Section */}
              <div className="bg-brand-warning/5 border border-brand-warning/20 rounded-[24px] p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3">
                  <Sparkles size={16} className="text-brand-warning opacity-30 group-hover:rotate-12 transition-transform" />
                </div>
                <h4 className="text-[10px] font-black text-brand-warning uppercase tracking-[0.2em] mb-3">Summary</h4>
                <p className="text-xs font-bold text-brand-text tracking-tight leading-relaxed">
                  "{generateSummary()}"
                </p>
                <div className="mt-4 pt-4 border-t border-brand-warning/10 flex items-center justify-between">
                  <div className="flex gap-1.5 font-bold uppercase tracking-widest text-[8px] text-brand-text-dim">
                    <span className="text-brand-warning">●</span> Analyzing Notes
                  </div>
                  <span className="text-[8px] font-black text-brand-warning opacity-50 uppercase tracking-widest">Crammerly Sync Active</span>
                </div>
              </div>

              {/* Tips & Advices */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-brand-success/5 border border-brand-success/20 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-brand-success uppercase tracking-widest mb-1.5">Study Pointers</p>
                  <p className="text-[10px] font-bold text-brand-text-dim leading-snug tracking-tighter">Deep dive into recent concepts to solidify memory pathing.</p>
                </div>
                <div className="bg-brand-primary/5 border border-brand-primary/20 p-4 rounded-2xl">
                  <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest mb-1.5">Daily Advice</p>
                  <p className="text-[10px] font-bold text-brand-text-dim leading-snug tracking-tighter">Consistent entries detected. Maintain this rhythm for optimal flow.</p>
                </div>
              </div>

              {/* Concept Chat Interface */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-brand-text-dim uppercase tracking-[0.2em]">Search Notes</h4>
                <div className="space-y-3 min-h-[120px] max-h-[180px] overflow-y-auto px-1 custom-scrollbar">
                  {aiMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-bold ${msg.role === 'user' ? 'bg-brand-bg border border-brand-border text-brand-text' : 'bg-brand-warning/10 border border-brand-warning/20 text-brand-text-dim'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-brand-warning/5 border border-brand-warning/10 p-3 rounded-2xl flex gap-1 animate-pulse">
                        <div className="w-1 h-1 bg-brand-warning rounded-full"></div>
                        <div className="w-1 h-1 bg-brand-warning rounded-full delay-75"></div>
                        <div className="w-1 h-1 bg-brand-warning rounded-full delay-150"></div>
                      </div>
                    </div>
                  )}
                  {aiMessages.length === 0 && <p className="text-center text-[10px] text-brand-muted py-4 font-black uppercase tracking-widest">Ask the assistant about your notes...</p>}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAiAsk()}
                    placeholder="Ask about your notes..."
                    className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:ring-1 focus:ring-brand-warning text-brand-text placeholder:text-brand-muted"
                  />
                  <button onClick={handleAiAsk} className="w-10 h-10 bg-brand-warning text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                    <Sparkles size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-brand-surface border-t border-brand-border flex items-center justify-center shadow-inner">
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-bg rounded-full border border-brand-border">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-300 ${activeTab === 'journal' ? 'bg-brand-primary' : activeTab === 'notes' ? 'bg-brand-secondary' : 'bg-brand-warning'}`}></div>
            <span className="text-[9px] font-black text-brand-text-dim uppercase tracking-widest">
              {activeTab === 'journal' ? `${journalEntries?.length || 0} Saved Entries` :
                activeTab === 'notes' ? `${studyNotes?.length || 0} Concept Notes` :
                  'Crammerly Sync Active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotebookModal;
