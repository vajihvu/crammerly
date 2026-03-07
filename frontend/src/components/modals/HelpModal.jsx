import React from 'react';
import { X, HelpCircle, Search, ChevronRight, MessageSquare, Book, PlayCircle, LifeBuoy } from 'lucide-react';

function HelpModal({ onClose }) {
    const categories = [
        { title: 'Getting Started', icon: <PlayCircle size={20} />, count: 12 },
        { title: 'Study Room Guide', icon: <Book size={20} />, count: 8 },
        { title: 'Common Issues', icon: <LifeBuoy size={20} />, count: 15 },
        { title: 'Community Rules', icon: <MessageSquare size={20} />, count: 5 }
    ];

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[32px] w-full max-w-xl h-full sm:h-auto sm:max-h-[85vh] border-0 sm:border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col font-sans overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="p-5 md:p-8 pb-3 flex justify-between items-start shrink-0">
                    <div className="flex-1 flex flex-col items-center">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-3 border border-brand-primary/20">
                            <HelpCircle size={24} className="text-brand-primary w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-[1000] text-brand-text tracking-tighter uppercase mb-1.5 leading-none text-center">Help Center</h2>
                        <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] opacity-80 text-center">We are here to help you</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all shadow-md border border-brand-border/30 absolute top-5 right-5 sm:top-6 sm:right-6"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 md:px-8">
                    <div className="relative mb-6 md:mb-8 pt-2">
                        <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search for help..."
                            className="w-full pl-10 md:pl-12 pr-5 py-3 bg-brand-bg border border-brand-border rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                        {categories.map((cat, i) => (
                            <button key={i} className="flex items-center justify-between p-3 md:p-4 bg-brand-bg/40 hover:bg-brand-bg rounded-[20px] md:rounded-2xl border border-brand-border/20 hover:border-brand-primary group transition-all text-left">
                                <div className="flex items-center gap-3">
                                    <div className="text-brand-primary group-hover:scale-110 transition-transform shrink-0">{cat.icon}</div>
                                    <div className="min-w-0">
                                        <p className="text-xs md:text-sm font-black text-brand-text uppercase tracking-tight leading-none truncate">{cat.title}</p>
                                        <p className="text-[9px] font-bold text-brand-text-dim mt-1 uppercase tracking-widest">{cat.count} PAGES</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-brand-muted group-hover:text-brand-primary transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-5 md:px-8 md:py-6 border-t border-brand-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-brand-surface">
                    <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Need more help?</p>
                        <p className="text-[9px] font-medium text-brand-text-dim mt-0.5 uppercase tracking-widest">We usually reply within 2 hours.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-4 text-[9px] font-semibold text-brand-text-dim uppercase tracking-widest">
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-brand-text transition-colors">Privacy</a>
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-brand-text transition-colors">Terms</a>
                            <a href="https://status.crammerly.io" target="_blank" rel="noopener noreferrer" className="hover:text-brand-text transition-colors">Status</a>
                        </div>
                        <a
                            href="mailto:support@crammerly.io"
                            className="px-6 py-2.5 bg-brand-text text-brand-bg rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            Email Us
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HelpModal;
