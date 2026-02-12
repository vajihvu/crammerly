import React, { useState } from 'react';
import { UserPlus, MessageCircle, X, Check, Search, TrendingUp, Sparkles } from 'lucide-react';

const FriendSuggestionsDropdown = ({ currentUser, onAddFriend, onSendMessage, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [pendingRequests, setPendingRequests] = useState(new Set());
    const [sentMessages, setSentMessages] = useState({}); // { userId: messageCount }
    const [activeMessageId, setActiveMessageId] = useState(null);
    const [currentMessage, setCurrentMessage] = useState('');


    // Mock suggested users with interests
    const suggestedUsers = [
        { id: 'S-772', name: 'Quantum Dev', avatar: 'Q', interests: ['Web Development', 'Algorithms'], bio: 'Building the future of web.', mutualFriends: 3 },
        { id: 'S-109', name: 'Logic Master', avatar: 'L', interests: ['Data Structures', 'Math'], bio: 'CS Student at MIT.', mutualFriends: 5 },
        { id: 'S-441', name: 'Cyber Sentinel', avatar: 'C', interests: ['Security', 'Python'], bio: 'Security enthusiast.', mutualFriends: 2 },
        { id: 'S-882', name: 'Pixel Artist', avatar: 'P', interests: ['Design', 'React'], bio: 'UI/UX Designer.', mutualFriends: 12 },
        { id: 'S-553', name: 'Binary Bard', avatar: 'B', interests: ['Algorithms', 'Poetry'], bio: 'Coding by day, writing by night.', mutualFriends: 1 },
        { id: 'S-122', name: 'Astro Learner', avatar: 'A', interests: ['Astro Physics', 'Algorithms'], bio: 'Learning about the stars.', mutualFriends: 7 },
    ];

    // Filter based on interests or search term
    const filteredSuggestions = suggestedUsers.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const hasCommonInterests = user.interests.some(interest => currentUser.interests.includes(interest));
        return (matchesSearch || hasCommonInterests) && !currentUser.friends.some(f => f.name === user.name);
    });

    const handleAddFriend = (user) => {
        setPendingRequests(prev => new Set(prev).add(user.id));
        onAddFriend?.(user);
    };

    const handleMessageIconClick = (user) => {
        if (activeMessageId === user.id) {
            setActiveMessageId(null);
            return;
        }

        const currentCount = sentMessages[user.id] || 0;
        const isFriend = currentUser.friends.some(f => f.name === user.name);

        if (!isFriend && currentCount >= 1) {
            // TODO: Add toast notification when component has access to addToast
            console.warn("Wait for friend request to be accepted to send more messages.");
            return;
        }


        setActiveMessageId(user.id);
        setCurrentMessage('');
    };

    const handleSendMessage = (user) => {
        if (!currentMessage.trim()) return;

        setSentMessages(prev => ({ ...prev, [user.id]: (prev[user.id] || 0) + 1 }));
        onSendMessage?.(user, currentMessage);
        setActiveMessageId(null);
        setCurrentMessage('');
    };


    return (
        <>
            <div className="fixed inset-0 z-[90]" onClick={onClose}></div>
            <div className="absolute left-0 mt-4 w-[380px] bg-brand-surface rounded-[32px] border border-brand-border shadow-dropdown z-[9999] p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-brand-border/50 bg-gradient-to-br from-brand-primary/5 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="text-brand-primary" size={18} />
                            <h3 className="text-lg font-black text-brand-text tracking-tight uppercase">Suggested For You</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-brand-muted/20 rounded-full transition-all">
                            <X size={18} className="text-brand-text-dim" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                        <input
                            type="text"
                            placeholder="Search people..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-brand-bg border border-brand-border rounded-2xl text-xs font-bold text-brand-text focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-brand-muted"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredSuggestions.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <TrendingUp className="mx-auto mb-3 text-brand-muted" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">No suggestions found</p>
                        </div>
                    ) : (
                        filteredSuggestions.map((user) => (
                            <div key={user.id} className="group p-4 bg-brand-bg/50 hover:bg-brand-muted/10 rounded-2xl border border-brand-border hover:border-brand-primary/50 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-brand-card rounded-full flex items-center justify-center text-lg font-black text-brand-primary border-2 border-brand-border group-hover:border-brand-primary transition-all">
                                                {user.avatar}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-success border-2 border-brand-surface rounded-full"></div>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-bold text-brand-text truncate uppercase">{user.name}</h4>
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="text-[9px] font-black text-brand-text-dim uppercase truncate">
                                                    {user.mutualFriends} Mutual Friends
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {pendingRequests.has(user.id) ? (
                                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-success/10 text-brand-success text-[10px] font-black uppercase tracking-widest rounded-xl border border-brand-success/20 cursor-default">
                                                <Check size={12} />
                                                Sent
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleAddFriend(user)}
                                                className="px-4 py-1.5 bg-brand-text hover:bg-white text-brand-bg text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg"
                                            >
                                                Follow
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleMessageIconClick(user)}
                                            className={`p-2 rounded-xl transition-all ${activeMessageId === user.id ? 'bg-brand-primary/20 text-brand-primary' : 'text-brand-text-dim hover:text-brand-primary hover:bg-brand-primary/10'}`}
                                            title="Message"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    </div>
                                </div>

                                {activeMessageId === user.id && (
                                    <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Type a message..."
                                                value={currentMessage}
                                                onChange={(e) => setCurrentMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(user)}
                                                className="flex-1 px-3 py-2 bg-brand-bg border border-brand-border rounded-xl text-[11px] font-bold text-brand-text focus:outline-none focus:border-brand-primary/50"
                                            />
                                            <button
                                                onClick={() => handleSendMessage(user)}
                                                className="px-3 py-2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md font-sans"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-1.5">

                                    {user.interests.map(interest => (
                                        <span key={interest} className="px-2 py-0.5 bg-brand-primary/5 text-[8px] font-black text-brand-primary uppercase tracking-tighter rounded-full border border-brand-primary/10">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-brand-border/50 bg-brand-bg/50 text-center">
                    <button className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">
                        See All Suggestions
                    </button>
                </div>
            </div>
        </>
    );
};

export default FriendSuggestionsDropdown;
