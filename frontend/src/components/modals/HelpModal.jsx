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
                className="bg-brand-surface sm:rounded-[40px] w-full max-w-2xl h-full sm:h-auto sm:max-h-[90vh] border-0 sm:border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col font-sans overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="p-6 md:p-10 pb-4 flex justify-between items-start shrink-0">
                    <div className="flex-1 flex flex-col items-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4 md:mb-6 border border-brand-primary/20">
                            <HelpCircle size={28} className="text-brand-primary md:w-8 md:h-8" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-[1000] text-brand-text tracking-tighter uppercase mb-2 leading-none text-center">Help Center</h2>
                        <p className="text-[10px] md:text-[11px] font-black text-brand-primary uppercase tracking-[0.3em] opacity-80 text-center">We are here to help you</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2.5 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all shadow-md border border-brand-border/30 absolute top-6 right-6 sm:top-10 sm:right-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-6 md:px-10">
                    <div className="relative mb-8 md:mb-10 pt-4">
                        <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 mt-2 text-brand-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Search for help..."
                            className="w-full pl-14 md:pl-16 pr-6 py-4 md:py-5 bg-brand-bg border border-brand-border rounded-2xl md:rounded-3xl text-sm font-bold text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-10">
                        {categories.map((cat, i) => (
                            <button key={i} className="flex items-center justify-between p-4 md:p-5 bg-brand-bg/40 hover:bg-brand-bg rounded-[24px] md:rounded-3xl border border-brand-border/20 hover:border-brand-primary group transition-all text-left">
                                <div className="flex items-center gap-4">
                                    <div className="text-brand-primary group-hover:scale-110 transition-transform shrink-0">{cat.icon}</div>
                                    <div className="min-w-0">
                                        <p className="text-xs md:text-sm font-black text-brand-text uppercase tracking-tight leading-none truncate">{cat.title}</p>
                                        <p className="text-[9px] font-bold text-brand-text-dim mt-1.5 uppercase tracking-widest">{cat.count} PAGES</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-brand-muted group-hover:text-brand-primary transition-colors shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-6 md:px-10 md:py-8 border-t border-brand-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-brand-surface">
                    <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Need more help?</p>
                        <p className="text-[9px] font-medium text-brand-text-dim mt-1 uppercase tracking-widest">We usually reply within 2 hours.</p>
                    </div>
                    <button className="w-full sm:w-auto px-8 py-3.5 bg-brand-text text-brand-bg rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all">Chat with us</button>
                </div>
            </div>
        </div>
    );
}

export default HelpModal;
