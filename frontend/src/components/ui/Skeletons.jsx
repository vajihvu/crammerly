// src/components/ui/Skeletons.jsx
import React from 'react';

/* ─── Pulse animation base ─── */
const pulse = 'animate-pulse bg-brand-border/30 rounded-xl';

/* ─── Room Card Skeleton ─── */
export function RoomCardSkeleton() {
    return (
        <div className="bg-brand-surface rounded-[24px] p-6 border border-brand-border/40 overflow-hidden relative">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${pulse}`} />
                        <div className={`h-3 w-16 ${pulse}`} />
                    </div>
                    <div className={`h-6 w-3/4 ${pulse}`} />
                </div>
                <div className={`w-9 h-9 ${pulse} rounded-xl`} />
            </div>
            <div className="space-y-4">
                <div className="flex gap-2">
                    <div className={`h-5 w-16 ${pulse} rounded-lg`} />
                    <div className={`h-5 w-14 ${pulse} rounded-lg`} />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-brand-border/20">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => <div key={i} className={`w-7 h-7 rounded-full ${pulse}`} />)}
                    </div>
                    <div className={`h-4 w-10 ${pulse}`} />
                </div>
                <div className={`h-10 w-28 ${pulse} rounded-xl`} />
            </div>
        </div>
    );
}

/* ─── Room Grid Skeleton (multiple cards) ─── */
export function RoomGridSkeleton({ count = 6 }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <RoomCardSkeleton key={i} />
            ))}
        </div>
    );
}

/* ─── Chat Message Skeleton ─── */
export function ChatMessageSkeleton({ align = 'left' }) {
    return (
        <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} gap-2`}>
            {align === 'left' && <div className={`w-8 h-8 rounded-full ${pulse} shrink-0`} />}
            <div className={`max-w-[60%] space-y-2 ${align === 'right' ? 'items-end' : ''}`}>
                {align === 'left' && <div className={`h-3 w-20 ${pulse}`} />}
                <div className={`${pulse} rounded-2xl p-4 space-y-2`}>
                    <div className={`h-3 w-full ${pulse}`} />
                    <div className={`h-3 w-3/4 ${pulse}`} />
                </div>
                <div className={`h-2 w-12 ${pulse}`} />
            </div>
        </div>
    );
}

/* ─── Chat Skeleton (multiple messages) ─── */
export function ChatSkeleton() {
    return (
        <div className="space-y-5 p-4">
            <ChatMessageSkeleton align="left" />
            <ChatMessageSkeleton align="right" />
            <ChatMessageSkeleton align="left" />
            <ChatMessageSkeleton align="right" />
            <ChatMessageSkeleton align="left" />
        </div>
    );
}

/* ─── Network Error with Retry ─── */
export function NetworkError({ message = 'Failed to load data', onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 bg-brand-danger/10 rounded-2xl flex items-center justify-center mb-4 border border-brand-danger/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-danger">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <h4 className="text-sm font-black text-brand-text uppercase tracking-widest mb-2">{message}</h4>
            <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest mb-6 max-w-[240px]">
                Check your connection and try again
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-6 py-2.5 bg-brand-text text-brand-bg rounded-xl text-[10px] font-[1000] uppercase tracking-widest shadow-premium transition-all active:scale-95 hover:bg-brand-text/90"
                >
                    Retry
                </button>
            )}
        </div>
    );
}

/* ─── Generic Empty State ─── */
export function EmptyState({ icon, title, description, action }) {
    return (
        <div className="bg-brand-card rounded-3xl p-12 text-center border-2 border-dashed border-brand-border flex-1 flex flex-col items-center justify-center">
            {icon && (
                <div className="w-20 h-20 bg-brand-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    {icon}
                </div>
            )}
            <h3 className="text-2xl font-bold text-brand-text-dim mb-4 font-sans">{title}</h3>
            {description && <p className="text-brand-muted max-w-sm mx-auto mb-8 font-sans">{description}</p>}
            {action}
        </div>
    );
}
