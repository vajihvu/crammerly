import React from 'react';
import { X, BarChart3, Clock, Zap, Target, ArrowUpRight, CheckCircle2 } from 'lucide-react';

function ActivityModal({ onClose, stats: dynamicStats }) {
    const stats = [
        { label: 'Focus Time', value: `${(dynamicStats?.totalMinutes / 60).toFixed(1)}h`, icon: <Clock size={16} />, color: 'text-brand-primary' },
        { label: 'Sessions', value: dynamicStats?.sessionCount || 0, icon: <ArrowUpRight size={16} />, color: 'text-brand-success' },
        { label: 'Finished Tasks', value: '154', icon: <CheckCircle2 size={16} />, color: 'text-brand-primary' },
        { label: 'Day Streak', value: '5 Days', icon: <Zap size={16} />, color: 'text-brand-warning' }
    ];

    const weeklyActivity = [
        { day: 'Mon', h: 4 }, { day: 'Tue', h: 6 }, { day: 'Wed', h: 5 },
        { day: 'Thu', h: 8 }, { day: 'Fri', h: 3 }, { day: 'Sat', h: 2 }, { day: 'Sun', h: 0 }
    ];

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[40px] w-full max-w-3xl h-full sm:h-auto sm:max-h-[80vh] border-0 sm:border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col font-sans overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="p-6 md:p-10 pb-4 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-4 mb-2 md:mb-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brand-primary">
                                <BarChart3 size={20} className="md:w-6 md:h-6" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-[1000] text-brand-text tracking-tighter uppercase leading-none pt-1">My Activity</h2>
                        </div>
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-14 md:ml-16 opacity-80">Track your progress</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2.5 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all shadow-md border border-brand-border/30"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-6 md:px-10 pb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12 pt-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-brand-bg/40 p-4 md:p-5 rounded-3xl border border-brand-border/20 group hover:border-brand-primary/50 transition-all">
                                <div className={`${stat.color} mb-2 md:mb-3 group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                                <p className="text-[9px] md:text-[10px] font-black text-brand-text-dim uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-xl md:text-2xl font-[1000] text-brand-text tracking-tighter">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6 pb-2">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">Study Time</h3>
                            <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-widest">Past week</span>
                        </div>

                        <div className="bg-brand-bg/20 p-4 md:p-8 rounded-[24px] md:rounded-[32px] border border-brand-border/20">
                            <div className="flex items-end justify-between h-32 md:h-40 gap-2 md:gap-4">
                                {weeklyActivity.map((d, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 md:gap-4 group">
                                        <div className="relative w-full flex justify-center">
                                            <div
                                                className="w-full max-w-[32px] md:max-w-[40px] bg-brand-primary/20 rounded-lg md:rounded-xl group-hover:bg-brand-primary/40 transition-all relative overflow-hidden"
                                                style={{ height: `${(d.h / 8) * 100}%`, minHeight: '8px' }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 to-transparent"></div>
                                            </div>
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-black text-brand-text-dim uppercase tracking-widest">{d.day}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 md:p-5 bg-brand-primary text-brand-bg shrink-0 flex items-center gap-4 shadow-2xl">
                    <Target size={20} className="md:w-6 md:h-6 shrink-0" />
                    <div className="flex-1 min-w-0 text-white">
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-widest truncate">Daily Goal met!</p>
                        <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-1 line-clamp-1">You studied enough today. Good job!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ActivityModal;
