import React from 'react';
import { X, Info, Globe, Twitter, Github, Heart, Code2 } from 'lucide-react';

function AboutModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[40px] w-full max-w-md h-full sm:h-auto border-0 sm:border border-brand-border/30 shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-500 relative flex flex-col items-center justify-center overflow-hidden font-sans text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-6 right-6 z-20">
                    <button onClick={onClose} className="p-2 text-brand-text-dim hover:text-brand-text bg-brand-muted/10 md:bg-transparent hover:bg-brand-muted/20 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-8 md:mb-10 pt-4">
                    <h1 className="text-3xl md:text-4xl font-[1000] text-brand-text tracking-tighter uppercase leading-none mb-4">CRAMMER<span className="text-brand-primary">LY</span></h1>
                    <div className="inline-block px-4 py-1.5 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                        <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">PRO VERSION 1.2.0</p>
                    </div>
                </div>

                <p className="text-[12px] md:text-[13px] font-medium text-brand-text leading-relaxed mb-8 md:mb-10 px-2 md:px-4">
                    Empowering the next generation of lifelong learners through real-time collaborative focus environments and AI-driven study assistance.
                </p>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-12 w-full">
                    <div className="p-4 bg-brand-bg/40 rounded-[24px] md:rounded-3xl border border-brand-border/20">
                        <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Users Active</p>
                        <p className="text-lg md:text-xl font-[1000] text-brand-text tracking-tighter">1.4M+</p>
                    </div>
                    <div className="p-4 bg-brand-bg/40 rounded-[24px] md:rounded-3xl border border-brand-border/20">
                        <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">Countries</p>
                        <p className="text-lg md:text-xl font-[1000] text-brand-text tracking-tighter">180+</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8 md:mb-10">
                    <div className="flex items-center justify-center gap-4 md:gap-6">
                        <button className="p-3 bg-brand-bg rounded-xl md:rounded-2xl border border-brand-border/30 text-brand-text-dim hover:text-brand-primary hover:border-brand-primary transition-all active:scale-90"><Globe size={18} className="md:w-5 md:h-5" /></button>
                        <button className="p-3 bg-brand-bg rounded-xl md:rounded-2xl border border-brand-border/30 text-brand-text-dim hover:text-brand-primary hover:border-brand-primary transition-all active:scale-90"><Twitter size={18} className="md:w-5 md:h-5" /></button>
                        <button className="p-3 bg-brand-bg rounded-xl md:rounded-2xl border border-brand-border/30 text-brand-text-dim hover:text-brand-primary hover:border-brand-primary transition-all active:scale-90"><Github size={18} className="md:w-5 md:h-5" /></button>
                    </div>
                </div>

                <div className="pt-8 border-t border-brand-border/20 w-full">
                    <div className="flex items-center justify-center gap-2 text-[9px] md:text-[10px] font-black text-brand-text-dim uppercase tracking-[0.2em]">
                        <Code2 size={10} className="text-brand-primary" />
                        Built with
                        <Heart size={10} className="text-brand-danger" fill="currentColor" />
                        by Global Edge Team
                    </div>
                    <p className="text-[8px] md:text-[9px] font-medium text-brand-muted mt-3 uppercase tracking-widest">© 2026 Crammerly Systems Inc. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

export default AboutModal;
