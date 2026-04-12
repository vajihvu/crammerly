import React from 'react';
import { PhoneCall, MessageCircle } from 'lucide-react';

const FriendItem = ({ friend, onChat, onCall, onProfile }) => (
    <div
        onClick={() => onProfile && onProfile(friend)}
        className="group bg-brand-card hover:bg-brand-surface p-4 sm:p-5 rounded-[24px] sm:rounded-[28px] flex items-center justify-between transition-all cursor-pointer border border-brand-border/30 hover:border-brand-primary/50 shadow-lg"
    >
        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-bg rounded-full flex items-center justify-center overflow-hidden border-2 border-brand-border group-hover:border-brand-primary/50 transition-all">
                    {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-lg sm:text-xl font-black text-brand-muted group-hover:text-brand-primary">
                            {(friend.name || friend.username || '?')[0].toUpperCase()}
                        </span>
                    )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 sm:border-4 border-brand-bg rounded-full ${friend.isOnline ? 'bg-brand-success' : 'bg-brand-muted'}`}></div>
            </div>
            <div className="font-inter min-w-0">
                <h4 className="text-sm font-bold text-brand-text group-hover:text-brand-primary transition-colors tracking-tight uppercase truncate">{friend.name || friend.username}</h4>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1 h-1 rounded-full ${friend.isOnline ? 'bg-brand-success' : 'bg-brand-muted'}`}></span>
                    <p className={`text-[8px] uppercase font-semibold tracking-widest transition-colors ${friend.isOnline ? 'text-brand-success' : 'text-brand-text-dim'}`}>
                        {friend.isOnline ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
            <button
                onClick={(e) => { e.stopPropagation(); onCall(); }}
                className="w-9 h-9 sm:w-11 sm:h-11 bg-brand-muted/20 hover:bg-brand-primary text-brand-text-dim hover:text-white rounded-xl sm:rounded-[18px] flex items-center justify-center transition-all active:scale-95 border border-brand-border/50 shadow-md"
            >
                <PhoneCall size={16} className="sm:w-5 sm:h-5" />
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onChat(); }}
                className="w-9 h-9 sm:w-11 sm:h-11 bg-brand-muted/20 hover:bg-brand-primary text-brand-text-dim hover:text-white rounded-xl sm:rounded-[18px] flex items-center justify-center transition-all active:scale-95 border border-brand-border/50 shadow-md"
            >
                <MessageCircle size={16} className="sm:w-5 sm:h-5" />
            </button>
        </div>
    </div>
);

export default React.memo(FriendItem);
