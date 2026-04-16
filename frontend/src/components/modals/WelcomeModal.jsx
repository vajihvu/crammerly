import React from 'react';
import { X, Sparkles, BookOpen, Users, Zap, CheckCircle } from 'lucide-react';

function WelcomeModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-brand-bg/90 backdrop-blur-2xl flex items-center justify-center p-4 z-[300] animate-in fade-in duration-500" onClick={onClose}>
            <div
                className="bg-brand-surface rounded-[32px] p-6 sm:p-8 max-w-xl w-full border border-brand-border/40 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-500 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Background Accents */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-secondary/5 rounded-full blur-3xl -ml-24 -mb-24"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-5 rotate-12 group hover:rotate-0 transition-transform duration-500 border border-brand-primary/20">
                        <Sparkles size={28} className="text-brand-primary" />
                    </div>

                    <h2 className="text-2xl sm:text-4xl font-[1000] text-brand-text tracking-tighter uppercase mb-2 leading-none">
                        Welcome to <span className="text-brand-primary">Crammerly</span>
                    </h2>

                    <p className="text-xs sm:text-sm text-brand-text-dim font-bold max-w-md mb-8 uppercase tracking-widest opacity-60">
                        Your Ultimate Collaborative Study Hub
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left mb-8">
                        {[
                            {
                                icon: BookOpen,
                                title: 'Global Rooms',
                                desc: 'Join specialized study rooms for any topic or genre.',
                                color: 'text-brand-primary',
                                bg: 'bg-brand-primary/10'
                            },
                            {
                                icon: Users,
                                title: 'Team Up',
                                desc: 'Add friends, chat in real-time, and study together.',
                                color: 'text-brand-secondary',
                                bg: 'bg-brand-secondary/10'
                            },
                            {
                                icon: Zap,
                                title: 'Study Tools',
                                desc: 'Integrated notebooks, journals, and focus tracking.',
                                color: 'text-brand-warning',
                                bg: 'bg-brand-warning/10'
                            },
                            {
                                icon: CheckCircle,
                                title: 'Data Sync',
                                desc: 'Your progress and notes stay synced across devices.',
                                color: 'text-brand-success',
                                bg: 'bg-brand-success/10'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="flex gap-3 p-4 bg-brand-bg/40 rounded-2xl border border-brand-border/20 group hover:border-brand-primary/40 transition-all duration-300">
                                <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center shrink-0 border border-white/5`}>
                                    <feature.icon className={`${feature.color}`} size={20} />
                                </div>
                                <div>
                                    <h4 className="text-brand-text font-black uppercase text-xs tracking-wider mb-1 group-hover:text-brand-primary transition-colors">{feature.title}</h4>
                                    <p className="text-brand-text-dim text-[11px] font-bold leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-12 py-5 bg-black hover:bg-brand-primary text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-premium transition-all active:scale-95 group"
                    >
                        Let's Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}

export default WelcomeModal;
