import React, { useState } from 'react';
import { X, AlertCircle, Send, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

function BugReportModal({ onClose }) {
    const [submitted, setSubmitted] = useState(false);
    const [bugData, setBugData] = useState({ title: '', desc: '', type: 'UI/UX' });

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => onClose(), 2000);
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300">
                <div className="bg-brand-surface sm:rounded-[32px] w-full h-full sm:h-auto sm:max-w-sm p-8 md:p-10 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 shadow-2xl border-0 sm:border border-brand-border/30">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-success/10 rounded-full flex items-center justify-center mb-5 text-brand-success border-2 border-brand-success/20">
                        <CheckCircle2 size={32} className="md:w-10 md:h-10 animate-in zoom-in duration-500" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-[1000] text-brand-text tracking-tighter uppercase mb-2">Bug Reported</h2>
                    <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] opacity-80">Thank you for improving Crammerly</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[32px] w-full max-w-md h-full sm:h-auto sm:max-h-[85vh] border-0 sm:border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col font-sans overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="p-5 md:p-8 pb-3 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-brand-danger/10 rounded-xl flex items-center justify-center text-brand-danger">
                                <AlertCircle size={20} className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-[1000] text-brand-text tracking-tighter uppercase leading-none pt-1">Fix a Problem</h2>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-12 md:ml-14 opacity-80">Tell us what is wrong</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all shadow-md border border-brand-border/30"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 md:px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 pt-3">
                        <div>
                            <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-2 px-1">Type of problem</label>
                            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                                {['Look/Design', 'Broken', 'Sound/Video'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setBugData({ ...bugData, type })}
                                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${bugData.type === type
                                            ? 'bg-brand-primary text-white border-brand-primary shadow-lg'
                                            : 'bg-brand-bg/50 text-brand-text-dim border-brand-border/30 hover:border-brand-primary/50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-2 px-1">Short title</label>
                            <input
                                required
                                type="text"
                                placeholder="What is the problem?"
                                className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted"
                            />
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-2 px-1">More details</label>
                            <textarea
                                required
                                rows={3}
                                placeholder="How can we find the problem?"
                                className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted resize-none md:max-h-24"
                            ></textarea>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <button type="button" className="flex items-center gap-2 text-brand-primary hover:text-brand-text transition-colors group">
                                <ImageIcon size={18} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Add a picture</span>
                            </button>
                            <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-brand-text text-brand-bg rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
                                Send <Send size={14} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BugReportModal;
