import React from 'react';
import { UserPlus, MessageCircle } from 'lucide-react';

const SuggestionItem = ({
    user,
    onAdd,
    onToggleMessage,
    isActiveMessage,
    currentMessage,
    setCurrentMessage,
    onSendMessage,
    isPending
}) => (
    <div className="group p-4 bg-brand-bg/80 hover:bg-brand-card rounded-2xl border border-brand-border/50 hover:border-brand-primary/50 transition-all shadow-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-brand-card rounded-full flex items-center justify-center text-sm font-black text-brand-primary border border-brand-border/80 shrink-0 group-hover:scale-110 transition-transform shadow-premium">
                    {user.avatar || (user.name || '?')[0].toUpperCase()}
                </div>

                <div className="min-w-0">
                    <h4 className="text-xs font-bold text-brand-text truncate uppercase">{user.name}</h4>
                    <p className="text-[8px] font-black text-brand-text-dim uppercase truncate">{user.mutualFriends} Mutual</p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                {isPending ? (
                    <div className="px-2 py-1.5 bg-brand-success/10 text-brand-success text-[9px] font-black uppercase tracking-widest rounded-lg border border-brand-success/20">
                        Sent
                    </div>
                ) : (
                    <button
                        onClick={onAdd}
                        className="w-8 h-8 bg-brand-text hover:bg-brand-primary text-brand-bg rounded-full flex items-center justify-center transition-all active:scale-90 shadow-[0_4px_12px_rgba(0,0,0,0.3)] border border-brand-border/50"
                    >
                        <UserPlus size={16} />
                    </button>
                )}
                <button
                    onClick={onToggleMessage}
                    className={`p-1.5 rounded-lg transition-all ${isActiveMessage ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-dim hover:text-brand-primary hover:bg-brand-primary/10'}`}
                >
                    <MessageCircle size={16} />
                </button>
            </div>
        </div>

        {isActiveMessage && (
            <div className="mt-3 animate-in slide-in-from-top-1 duration-200">
                <div className="flex gap-1.5">
                    <input
                        autoFocus
                        type="text"
                        placeholder="Message..."
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                        className="flex-1 px-2 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-[10px] font-bold text-brand-text focus:outline-none focus:border-brand-primary/50"
                    />
                    <button
                        onClick={onSendMessage}
                        className="px-2 py-1.5 bg-brand-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                    >
                        Send
                    </button>
                </div>
            </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
            {(user.interests || []).slice(0, 2).map(int => (
                <span key={int} className="px-1.5 py-0.5 bg-brand-primary/15 text-[7px] font-black text-brand-primary uppercase rounded-full border border-brand-primary/30 group-hover:bg-brand-primary/25 transition-colors">
                    {int}
                </span>
            ))}
        </div>
    </div>
);

export default SuggestionItem;
