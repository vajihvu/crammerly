// src/components/modals/StreakModal.jsx
import React from 'react';
import { Flame, X, Trophy, Calendar, Target, Zap } from 'lucide-react';

function StreakStat({ value, label, icon, colorClass, borderClass, bgClass }) {
  const Icon = icon;
  return (
    <div className={`${bgClass} rounded-3xl p-5 border ${borderClass} flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] duration-300 relative overflow-hidden group shadow-xl`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-white/10 transition-all"></div>
      <Icon className={`${colorClass} mb-1 drop-shadow-lg`} size={24} />
      <div className={`text-3xl font-black ${colorClass} tracking-tight leading-none`}>{value}</div>
      <div className="text-[10px] font-black text-brand-text-dim uppercase tracking-[0.15em]">{label}</div>
    </div>
  );
}

function StreakModal({ currentUser, onClose, onBack }) {
  const streakDays = currentUser.streak || 5;
  const longestStreak = 12;
  const totalDays = 23;

  const days = Array.from({ length: 30 }, (_, i) => {
    let dayNum;
    if (i < 6) dayNum = 26 + i;
    else dayNum = i - 5;
    return dayNum;
  });

  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-start justify-center p-4 pt-24 pb-24 z-50 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar" onClick={onBack || onClose}>
      <div className="bg-brand-surface rounded-[32px] p-6 md:p-8 max-w-[500px] w-full border border-brand-border shadow-2xl relative animate-in zoom-in-95 duration-500 flex flex-col shrink-0 font-sans" onClick={(e) => e.stopPropagation()}>

        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-brand-primary/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-brand-primary/10 blur-[80px] pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onBack || onClose}
          className="absolute top-8 right-8 p-2.5 text-brand-text-dim hover:text-white hover:bg-brand-muted/20 rounded-full transition-all active:scale-90 z-20"
        >
          <X size={22} />
        </button>

        {/* Header Section */}
        <div className="mb-6 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-brand-muted border border-brand-border rounded-full flex items-center justify-center shadow-lg">
              <Flame className="text-brand-text" size={26} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-brand-text tracking-tight leading-none uppercase">Your Streak</h3>
              <p className="text-brand-text-dim text-sm font-bold mt-1 tracking-tight">Keep up the momentum!</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stat Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 relative z-10">
          <StreakStat
            value={streakDays}
            label="Current"
            icon={Zap}
            colorClass="text-brand-text"
            borderClass="border-brand-primary/30"
            bgClass="bg-brand-primary/20 shadow-lg"
          />
          <StreakStat
            value={longestStreak}
            label="Longest"
            icon={Trophy}
            colorClass="text-brand-text-dim"
            borderClass="border-brand-border/30"
            bgClass="bg-brand-muted/10 shadow-lg"
          />
          <StreakStat
            value={totalDays}
            label="Total Days"
            icon={Calendar}
            colorClass="text-brand-primary"
            borderClass="border-brand-border/20"
            bgClass="bg-brand-bg shadow-lg"
          />
        </div>

        {/* Calendar Section with improved grid */}
        <div className="bg-brand-bg/50 rounded-[36px] p-8 border border-brand-border/30 mb-6 relative z-10 shadow-inner">
          <div className="flex items-center justify-between mb-8">
            <h4 className="font-black text-brand-text text-lg tracking-tight uppercase">Last 30 Days</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-brand-text rounded-full shadow-lg"></div>
                <span className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-brand-muted/50 rounded-full"></div>
                <span className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest">Inactive</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-x-2 gap-y-3">
            {days.map((dayNum, idx) => {
              const isActive = idx >= 25;
              const isToday = idx === 29;

              return (
                <div key={idx} className="flex flex-col items-center gap-1 group/day">
                  <div
                    className={`w-full aspect-square rounded-[12px] flex items-center justify-center text-[11px] font-black transition-all duration-300 transform group-hover/day:scale-110 ${isActive
                      ? isToday
                        ? 'bg-brand-text text-brand-bg shadow-xl'
                        : 'bg-brand-muted text-brand-text border border-brand-border/20'
                      : 'bg-brand-bg text-brand-muted border border-brand-border/10'
                      }`}
                  >
                    {dayNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Banner */}
        <div className="mt-auto bg-brand-primary/10 rounded-[28px] p-6 border border-brand-primary/20 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target size={60} className="text-white -mr-4 -mt-4 rotate-12" />
          </div>

          <div className="relative flex flex-col items-center text-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-brand-primary/20 rounded-full border border-brand-primary/30">
              <span className="text-[10px] font-black text-brand-text uppercase tracking-widest">Status Update</span>
            </div>
            <p className="text-[15px] font-medium leading-relaxed">
              <span className="text-brand-text font-black">STREAK SECURED. 🚀</span>
              <br />
              <span className="text-brand-text-dim">
                You're on a <span className="text-brand-text font-black">{streakDays}-day streak</span>. Maintain the rhythm! 🎯
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreakModal;
