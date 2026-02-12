import React, { useState, useRef, useEffect } from 'react';
import { X, UserPlus, MessageCircle, Video, Phone, Paperclip, Smile, Image as ImageIcon, Send, Mic, Search, MoreVertical, Shield, FileText, Music, ArrowLeft, PhoneCall, Plus, Camera, Trash2, StopCircle, Sticker, User, Sparkles, Check, TrendingUp } from 'lucide-react';
import FriendItem from './friends/FriendItem';
import SuggestionItem from './friends/SuggestionItem';
import { friendsApi } from '../../api';

const MessageContent = ({ text }) => {
  const isCode = text.startsWith('```') && text.endsWith('```');
  if (isCode) {
    const code = text.slice(3, -3);
    return (
      <div className="bg-black/20 rounded-xl p-4 my-2 border border-white/5 font-mono text-[11px] overflow-x-auto text-left">
        <pre className="text-brand-primary/80 whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }
  return <p className="text-[14px] leading-relaxed font-semibold text-left">{text}</p>;
};

function FriendsModal({ currentUser = {}, onClose, friendsList = [], addToast }) {

  const [activeView, setActiveView] = useState('list');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMode, setChatMode] = useState('text');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem('crammer_dm_history');
    return saved ? JSON.parse(saved) : {};
  });
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [emojiPickerTab, setEmojiPickerTab] = useState('emoji'); // 'emoji', 'sticker', 'gif'
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentMessages, setSentMessages] = useState({}); // { userId: messageCount }
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [lastSearchedId, setLastSearchedId] = useState('');


  // friendsList and setFriendsList are now passed as props

  const defaultMessages = [
    { id: 'd1', text: 'Hey! Did you finish the editing session? 🎬', sender: 'them', time: '10:42 AM' },
    { id: 'd2', text: 'Almost done! Just adding some final transitions.', sender: 'me', time: '10:45 AM' }
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    localStorage.setItem('crammer_dm_history', JSON.stringify(chatHistory));
  }, [chatHistory, message, activeView]);

  const filteredFriends = (friendsList || []).filter(f =>
    (f.name || f.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFriends = [...filteredFriends]
    .sort((a, b) => (a.name || a.full_name || '').localeCompare(b.name || b.full_name || ''))
    .reduce((acc, friend) => {
      const name = friend.name || friend.full_name || 'U';
      const groupName = friend.status === 'online' ? 'Active Now' : name[0].toUpperCase();
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(friend);
      return acc;
    }, {});

  const openChat = (friend, mode = 'text') => {
    setSelectedFriend(friend);
    setChatMode(mode);
    setActiveView('chat');
    if (!chatHistory[friend.id]) {
      setChatHistory(prev => ({ ...prev, [friend.id]: [...defaultMessages] }));
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedFriend) return;

    const newMsg = {
      id: Date.now().toString(),
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => ({
      ...prev,
      [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMsg]
    }));
    setMessage('');
    setShowEmojiPicker(false);
    addToast(`Message sent to ${selectedFriend.name}`, 'success');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate voice note behavior
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedFriend) {
      const newMsg = {
        id: Date.now().toString(),
        text: `Sent a file: ${file.name}`,
        type: 'file',
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => ({
        ...prev,
        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMsg]
      }));
    }
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const [searchResults, setSearchResults] = useState(null);

  const handleSearch = async () => {
    if (!newFriendName.trim()) return;
    setIsSearching(true);
    setLastSearchedId(newFriendName);
    try {
      const results = await friendsApi.search(newFriendName);
      // Filter out self and already friends
      const filteredResults = results.filter(u =>
        u.id !== currentUser.id &&
        !friendsList.some(f => f.friendId === u.id)
      );
      setSearchResults(filteredResults.length > 0 ? filteredResults : 'none');
    } catch {
      addToast('Search failed', 'danger');
    } finally {
      setIsSearching(false);
    }
  };

  const addFoundFriend = async (user) => {
    try {
      await friendsApi.sendRequest(currentUser.id, user.id);
      setPendingRequests(prev => new Set([...prev, user.id]));
      addToast(`Friend request sent to ${user.full_name || user.username}`, 'success');
      setNewFriendName('');
      setSearchResults(null);
      setShowAddFriend(false);
    } catch {
      addToast('Failed to send request', 'danger');
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const results = await friendsApi.search('');
        setSuggestedUsers(results.filter(u => u.id !== currentUser.id && !friendsList.some(f => f.friendId === u.id)).slice(0, 6));
      } catch {
        console.error('Failed to fetch suggestions');
      }
    };
    fetchSuggestions();
  }, [friendsList, currentUser.id]);

  const handleAddSuggested = (user) => {
    addFoundFriend(user);
  };


  const handleSuggestionMessageClick = (user) => {
    if (activeMessageId === user.id) {
      setActiveMessageId(null);
      return;
    }
    const currentCount = sentMessages[user.id] || 0;
    const isFriend = friendsList.some(f => f.name === user.name);
    if (!isFriend && currentCount >= 1) {
      if (addToast) {
        addToast("Wait for friend request to be accepted to send more messages.", 'warning');
      }
      return;
    }
    setActiveMessageId(user.id);
    setCurrentMessage('');
  };

  const sendSuggestionMessage = (user) => {
    if (!currentMessage.trim()) return;
    setSentMessages(prev => ({ ...prev, [user.id]: (prev[user.id] || 0) + 1 }));
    // Mock sending
    if (addToast) {
      addToast(`Message sent to ${user.name}`, 'success');
    }
    setActiveMessageId(null);
    setCurrentMessage('');
  };

  const filteredSuggestions = suggestedUsers.filter(user => {
    return !friendsList.some(f => f.friendId === user.id);
  });



  const emojis = ['😊', '😂', '🔥', '🚀', '✨', '👍', '🙏', '🎬', '📸', '❤️', '😎', '🎉'];

  if (activeView === 'chat' && selectedFriend) {
    const currentChat = chatHistory[selectedFriend.id] || [];

    return (
      <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-md z-[150] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-brand-surface w-full max-w-md h-full sm:h-[85vh] sm:rounded-[40px] border-0 sm:border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 font-inter" onClick={(e) => e.stopPropagation()}>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} onClick={(e) => e.stopPropagation()} />
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-border/50 flex items-center justify-between bg-brand-bg/50 backdrop-blur-2xl shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button onClick={() => setActiveView('list')} className="p-2 hover:bg-brand-muted/20 rounded-full transition-all active:scale-90 shrink-0">
                <ArrowLeft size={20} className="text-brand-text sm:w-[22px]" />
              </button>
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-brand-muted rounded-full flex items-center justify-center font-black text-brand-text shadow-lg text-sm sm:text-base">
                  {selectedFriend.avatar}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 sm:border-4 border-brand-bg rounded-full ${selectedFriend.status === 'online' ? 'bg-brand-success' :
                  selectedFriend.status === 'do not disturb' ? 'bg-brand-danger' :
                    'bg-brand-muted'
                  }`}></div>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-brand-text truncate text-sm sm:text-base tracking-tight leading-tight">{selectedFriend.name}</h4>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedFriend.status === 'online' ? 'bg-brand-success animate-pulse' :
                    selectedFriend.status === 'away' ? 'bg-brand-warning' :
                      selectedFriend.status === 'busy' ? 'bg-brand-danger' :
                        'bg-brand-muted'
                    }`}></div>
                  <p className={`text-[9px] sm:text-[10px] uppercase font-semibold tracking-widest truncate ${selectedFriend.status === 'online' ? 'text-brand-success' :
                    selectedFriend.status === 'do not disturb' ? 'text-brand-danger' :
                      'text-brand-text-dim'
                    }`}>{selectedFriend.status}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              <button onClick={() => setChatMode('voice')} className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 ${chatMode === 'voice' ? 'bg-brand-primary text-white' : 'text-brand-text-dim hover:bg-brand-muted/20'}`}><PhoneCall size={16} sm:size={18} /></button>
              <button onClick={() => setChatMode('video')} className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 ${chatMode === 'video' ? 'bg-brand-primary text-white' : 'text-brand-text-dim hover:bg-brand-muted/20'}`}><Video size={18} sm:size={20} /></button>
              <button onClick={() => setChatMode('text')} className={`p-2 sm:p-2.5 rounded-xl transition-all shrink-0 ${chatMode === 'text' ? 'bg-brand-primary text-white' : 'text-brand-text-dim hover:bg-brand-muted/20'}`}><MessageCircle size={18} sm:size={20} /></button>
              <div className="w-px h-6 bg-brand-border/50 mx-0.5 sm:mx-1 shrink-0" />
              <button onClick={onClose} className="p-2 sm:p-2.5 text-brand-text-dim hover:text-brand-text transition-colors active:scale-95 shrink-0"><X size={18} sm:size={20} /></button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden relative">
            {chatMode === 'text' && (
              <div className="h-full flex flex-col bg-brand-bg relative">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-10 font-inter">
                  {currentChat.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${msg.sender === 'me' ? 'text-right' : ''}`}>
                        <div className={`p-4 rounded-[24px] shadow-lg border border-brand-border/50 ${msg.sender === 'me'
                          ? 'bg-brand-primary text-white rounded-tr-none'
                          : 'bg-brand-surface text-brand-text rounded-tl-none'
                          }`}>
                          <MessageContent text={msg.text} />
                          {msg.type === 'file' && (
                            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-black/10 rounded-lg">
                              <FileText size={16} className="text-brand-secondary" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Document Attachment</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-black mt-2 inline-block uppercase tracking-widest opacity-70 ${msg.sender === 'me' ? 'text-brand-secondary mr-1' : 'text-brand-text-dim ml-1'}`}>
                          {msg.time} {msg.sender === 'me' && '• READ'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Tabbed Picker Overlay */}
                {showEmojiPicker && (
                  <div className="absolute bottom-24 left-6 right-6 bg-brand-surface border border-brand-border rounded-3xl z-50 animate-in slide-in-from-bottom-4 shadow-2xl overflow-hidden flex flex-col h-64">
                    <div className="flex border-b border-brand-border/50 bg-brand-muted/10">
                      <button onClick={() => setEmojiPickerTab('emoji')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${emojiPickerTab === 'emoji' ? 'text-brand-text bg-brand-muted/20' : 'text-brand-text-dim hover:text-brand-text'}`}>Emojis</button>
                      <button onClick={() => setEmojiPickerTab('sticker')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${emojiPickerTab === 'sticker' ? 'text-brand-text bg-brand-muted/20' : 'text-brand-text-dim hover:text-brand-text'}`}>Stickers</button>
                      <button onClick={() => setEmojiPickerTab('gif')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${emojiPickerTab === 'gif' ? 'text-brand-text bg-brand-muted/20' : 'text-brand-text-dim hover:text-brand-text'}`}>GIFs</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                      {emojiPickerTab === 'emoji' && (
                        <div className="grid grid-cols-6 gap-3">
                          {emojis.map(e => <button key={e} onClick={() => addEmoji(e)} className="text-2xl hover:scale-125 transition-transform p-1">{e}</button>)}
                        </div>
                      )}
                      {emojiPickerTab === 'sticker' && (
                        <div className="grid grid-cols-4 gap-4">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <button key={i} className="aspect-square bg-brand-muted/10 rounded-xl flex items-center justify-center hover:bg-brand-muted/20 transition-all border border-brand-border/30 group">
                              <Sticker size={32} className="text-brand-primary group-hover:scale-110 transition-transform" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Input Area */}
                <div className="px-4 sm:px-8 pb-8 sm:pb-12 pt-4 bg-transparent shrink-0 relative z-20">
                  <div className="flex items-center gap-3 sm:gap-4 max-w-full">
                    <div className="flex-1 bg-brand-surface border border-brand-border rounded-[28px] min-h-[52px] flex items-center px-4 py-1.5 shadow-xl transition-all focus-within:ring-1 focus-within:ring-brand-primary min-w-0">
                      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 transition-colors shrink-0 ${showEmojiPicker ? 'text-brand-text' : 'text-brand-text-dim hover:text-brand-text'}`}><Smile size={24} /></button>
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => { setMessage(e.target.value); setShowEmojiPicker(false); }}
                        onKeyPress={handleKeyPress}
                        placeholder={isRecording ? "Recording..." : "Message"}
                        disabled={isRecording}
                        className="flex-1 bg-transparent px-2 py-2 text-[15px] text-brand-text focus:outline-none placeholder:text-brand-muted font-medium min-w-0 truncate"
                      />
                      {!isRecording && (
                        <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="p-2 text-brand-primary hover:text-brand-text transition-colors rotate-45 shrink-0"><Paperclip size={22} /></button>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); message.trim() ? handleSendMessage() : toggleRecording(); }}
                      className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 shrink-0 ${isRecording ? 'bg-brand-primary animate-pulse' : 'bg-brand-text hover:bg-brand-text/90'}`}
                    >
                      {message.trim() ? <Send size={18} fill="currentColor" className="text-brand-bg ml-0.5" /> : <Mic size={20} className="text-brand-bg" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(chatMode === 'voice' || chatMode === 'video') && (
              <div className="h-full bg-brand-bg flex flex-col items-center justify-center p-10">
                <div className="w-40 h-40 bg-brand-surface rounded-full flex items-center justify-center shadow-2xl mb-10 border-4 border-brand-primary/20">
                  {chatMode === 'voice' ? <Mic size={64} className="text-white animate-pulse" /> : <Video size={64} className="text-white animate-pulse" />}
                </div>
                <h2 className="text-2xl font-black text-brand-text mb-2">{selectedFriend.name}</h2>
                <p className="text-brand-primary text-xs font-black uppercase tracking-widest mb-10">Calling...</p>
                <button onClick={() => setChatMode('text')} className="w-16 h-16 bg-brand-text rounded-full flex items-center justify-center text-brand-bg rotate-[135deg] shadow-xl hover:bg-white transition-all">
                  <PhoneCall size={28} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl z-[150] flex items-start justify-center p-0 sm:p-4 pt-2 sm:pt-4 pb-6 overflow-y-auto animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-brand-surface w-full max-w-5xl min-h-screen sm:min-h-0 sm:h-[85vh] rounded-none sm:rounded-[40px] border-0 sm:border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-inter" onClick={(e) => e.stopPropagation()}>

        <div className="px-3.5 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-brand-border/50 bg-brand-bg/50 backdrop-blur-xl shrink-0 gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-6 min-w-0">
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-brand-muted/20 rounded-full transition-all shrink-0">
              <ArrowLeft size={18} className="text-brand-text sm:w-6 sm:h-6" />
            </button>
            <h2 className="text-[15px] sm:text-2xl font-black text-brand-text tracking-tight leading-none uppercase pt-0.5 truncate">Friends</h2>
          </div>
          {!showAddFriend && (
            <button
              onClick={() => setShowAddFriend(true)}
              className="text-brand-text font-black text-[9px] sm:text-[11px] uppercase tracking-widest hover:text-brand-primary transition-colors bg-brand-muted/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-brand-border shrink-0"
            >
              Add Friends
            </button>
          )}
        </div>

        {showAddFriend && (
          <div className="px-6 py-6 bg-brand-muted/10 border-b border-brand-border/30 animate-in slide-in-from-top duration-300">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                autoFocus
                value={newFriendName}
                onChange={(e) => { setNewFriendName(e.target.value); if (searchResults) setSearchResults(null); }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Unique UserID"
                className="flex-1 min-w-0 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-base text-brand-text focus:outline-none focus:border-brand-primary font-bold placeholder:text-brand-muted"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-text hover:bg-white text-brand-bg text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                {isSearching ? <Loader size={14} className="animate-spin" /> : 'Search'}
              </button>
              <button onClick={() => { setShowAddFriend(false); setSearchResults(null); setNewFriendName(''); }} className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-muted/20 hover:bg-brand-muted/40 text-brand-text-dim text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-brand-bg relative">
          {/* Left Side: Friends List */}
          <div className="w-full md:flex-1 flex flex-col border-b md:border-b-0 md:border-r border-brand-border/30 shrink-0 md:shrink md:overflow-hidden min-h-[500px] md:min-h-0">
            {!showAddFriend ? (
              <>
                <div className="px-4 sm:px-8 py-4 sm:py-6 bg-brand-bg/50 backdrop-blur-md shrink-0 border-b border-brand-border/10">

                  <div className="relative group">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={18} sm:size={20} />
                    <input
                      type="text"
                      placeholder="Search friends..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-brand-bg border border-brand-border rounded-[20px] sm:rounded-[24px] text-sm sm:text-base text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="md:flex-1 overflow-visible md:overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-10 custom-scrollbar bg-brand-bg">
                  {Object.keys(groupedFriends).sort().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-60">
                      <User size={64} className="text-brand-muted mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">No Friends Found</p>
                    </div>
                  ) : (
                    Object.keys(groupedFriends).sort((a, b) => {
                      if (a === 'Active Now') return -1;
                      if (b === 'Active Now') return 1;
                      return a.localeCompare(b);
                    }).map(group => (
                      <div key={group} className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <h3 className="text-[9px] sm:text-[10px] font-bold text-brand-muted tracking-[0.2em] sm:tracking-[0.3em] uppercase">{group}</h3>
                          <div className="flex-1 h-px bg-brand-border/10"></div>
                        </div>
                        <div className="space-y-3">
                          {groupedFriends[group].map((friend) => (
                            <FriendItem
                              key={friend.id}
                              friend={friend}
                              onChat={() => openChat(friend)}
                              onCall={() => openChat(friend, 'voice')}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-start pt-10 px-8 bg-brand-surface animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
                {searchResults === null ? (
                  <>
                    <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/20 mb-8 shadow-2xl">
                      <UserPlus size={48} className="text-brand-primary" />
                    </div>
                    <h3 className="text-2xl font-black text-brand-text uppercase mb-3 tracking-tighter text-center">Expand the Network</h3>
                    <p className="text-[11px] font-bold text-brand-text-dim uppercase tracking-[0.2em] max-w-[280px] leading-relaxed text-center">
                      Connect with collaborators by entering their User ID above.
                    </p>
                  </>
                ) : searchResults === 'none' ? (
                  <div className="text-center py-10">
                    <div className="w-20 h-20 bg-brand-muted/10 rounded-full flex items-center justify-center border border-brand-border/30 mb-6 mx-auto">
                      <X size={32} className="text-brand-muted" />
                    </div>
                    <h4 className="text-lg font-black text-brand-text uppercase tracking-tight mb-2">ID Not Found</h4>
                    <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">The User ID "{lastSearchedId}" does not exist.</p>
                  </div>
                ) : (
                  <div className="w-full max-w-md space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                    {Array.isArray(searchResults) && searchResults.map(user => (
                      <div key={user.id} className="bg-brand-card border border-brand-border rounded-[24px] p-4 flex items-center justify-between group/result shadow-xl hover:border-brand-primary/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center border border-brand-border text-xl font-black text-brand-text shadow-lg overflow-hidden">
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : (user.full_name || user.username || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-black text-brand-text uppercase tracking-tight leading-none mb-1 group-hover:text-brand-primary transition-colors">{user.full_name || user.username}</h3>
                            <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest">#{user.tag || '0000'}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => addFoundFriend(user)}
                          disabled={pendingRequests.has(user.id)}
                          className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 group-hover/result:scale-110 ${pendingRequests.has(user.id) ? 'bg-brand-muted text-brand-text-dim cursor-not-allowed' : 'bg-brand-text hover:bg-white text-brand-bg'}`}
                        >
                          {pendingRequests.has(user.id) ? <Check size={22} /> : <UserPlus size={22} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Suggestions */}
          <div className="w-full md:flex-1 bg-brand-surface/40 backdrop-blur-md flex flex-col shrink-0 md:overflow-hidden border-t md:border-t-0 md:border-l border-brand-border/20">
            <div className="p-6 border-b border-brand-border/30 bg-gradient-to-br from-brand-primary/10 via-transparent to-transparent shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="text-brand-primary drop-shadow-[0_0_8px_rgba(201,181,156,0.3)]" size={18} />
                <h3 className="text-lg font-black text-brand-text tracking-tight uppercase">Suggested For You</h3>
              </div>
            </div>


            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredSuggestions.length === 0 ? (
                <div className="text-center py-10 opacity-70">
                  <TrendingUp className="mx-auto mb-3 text-brand-muted" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-muted">No suggestions</p>
                </div>
              ) : (
                filteredSuggestions.map((user) => (
                  <SuggestionItem
                    key={user.id}
                    user={user}
                    isPending={pendingRequests.has(user.id)}
                    onAdd={() => handleAddSuggested(user)}
                    onToggleMessage={() => handleSuggestionMessageClick(user)}
                    isActiveMessage={activeMessageId === user.id}
                    currentMessage={currentMessage}
                    setCurrentMessage={setCurrentMessage}
                    onSendMessage={() => sendSuggestionMessage(user)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FriendsModal;