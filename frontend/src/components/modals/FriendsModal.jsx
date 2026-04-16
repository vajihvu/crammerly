import React, { useState, useRef, useEffect } from 'react';
import { useVideoCall } from '../../context/VideoCallContext';
import { X, UserPlus, MessageCircle, Video, Paperclip, Smile, Send, Mic, Search, FileText, ArrowLeft, PhoneCall, Sticker, User, Sparkles, Check, TrendingUp, Loader, Bell, UserCheck, ShieldClose, Play, Pause, Headphones, Github, Linkedin, Twitter, Instagram, GraduationCap, Code2, Heart } from 'lucide-react';
import { FriendListSkeleton } from '../ui/Skeletons';
import FriendItem from './friends/FriendItem';
import SuggestionItem from './friends/SuggestionItem';
import { friendsApi, notificationsApi, messagesApi } from '../../api';
import { getSocket } from '../../utils/socket';
const AudioMessage = ({ url, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);

  const togglePlay = async () => {
    if (hasError || !url || isLoading) return;
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Audio playback failed:', err);
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const onLoadedMetadata = () => {
    setIsLoading(false);
    if (audioRef.current) {
      // Handle Infinity duration (common in basic webm recordings)
      if (isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      } else {
        // Fallback for infinite duration: try to seek to end to force calculation
        audioRef.current.currentTime = 1e101;
        audioRef.current.ontimeupdate = () => {
            audioRef.current.ontimeupdate = onTimeUpdate;
            setDuration(audioRef.current.duration);
            audioRef.current.currentTime = 0;
        };
      }
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0;

  if (hasError) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-white/10' : 'bg-brand-muted/10'} rounded-2xl border border-brand-danger/30`}>
        <X className="text-brand-danger" size={20} />
        <span className="text-[10px] font-bold text-brand-danger uppercase">Playback Failed</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2 ${isMe ? 'bg-white/20' : 'bg-brand-muted/20'} rounded-2xl min-w-[220px] font-sans relative overflow-hidden`}>
      <button 
        onClick={togglePlay}
        disabled={isLoading}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isLoading ? 'opacity-50' : ''} ${isMe ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'}`}
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
      </button>
      
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-black tracking-tighter tabular-nums opacity-60">
            {isLoading ? '...' : formatTime(currentTime)}
          </span>
          <span className="text-[9px] font-black tracking-tighter tabular-nums opacity-60">
            {isLoading ? '...' : formatTime(duration)}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className={`absolute inset-y-0 left-0 ${isMe ? 'bg-white' : 'bg-brand-primary'} transition-all duration-300 rounded-full`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <Headphones size={14} className="opacity-30 shrink-0" />
      <audio 
        ref={audioRef} 
        src={url} 
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onError={() => setHasError(true)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }} 
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden" 
      />
    </div>
  );
};
const MessageContent = ({ text }) => {
  if (!text) return null;
  const isCode = text.startsWith('```') && text.endsWith('```');
  if (isCode) {
    const code = text.slice(3, -3);
    return (
      <div className="bg-black/40 rounded-xl p-4 my-2 border border-white/10 font-mono text-[11px] overflow-x-auto text-left w-full">
        <pre className="text-brand-primary whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }
  return <p className="font-medium leading-relaxed text-left">{text}</p>;
};

import { useUI } from '../../context/UIContext';

function FriendsModal({ currentUser, onClose, addToast }) {
  const { resetUnreadMessages } = useUI();
  const [activeView, setActiveView] = useState('list'); // 'list' or 'chat'
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
  const [friends, setFriends] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  useEffect(() => {
    // Clear global unread message indicator when opening Friends modal
    resetUnreadMessages();
  }, [resetUnreadMessages]);

  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatMode, setChatMode] = useState('text');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  
  const [chatHistory, setChatHistory] = useState({});
  const [loadedChats, setLoadedChats] = useState(new Set());
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [emojiPickerTab, setEmojiPickerTab] = useState('emoji');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');

  // GIF & Media State
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);

  const EMOJI_DATA = {
    "Smileys": ["😊", "😂", "🤣", "❤️", "😍", "🥰", "😎", "🤩", "🤔", "🙄", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐"],
    "Gestures": ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "👈", "👉", "👆", "👇", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🖕", "✍️", "🙏", "💍", "💄", "👣"],
    "Nature": ["🐱", "🐶", "🐯", "🦁", "🐮", "🐷", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐒", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐜", "🦗", "🕷️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙"],
    "Food": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌽", "🥕", "🥔", "🍠", "🥐", "🍞", "🥖", "🥨", "🥯", "🧀", "🥚", "🍳", "🥓", "🥩", "🥞", "🍖", "🍗", "🍔"],
    "Activities": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🏒", "🏑", "🏏", "🎯", "⛳", "🏹", "🎣", "🥊", "🥋", "⛸️", "🎿", "🛷", "🛹", "🚴", "🚵", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🎫", "🎟️", "🎭", "🎨", "🎬", "🎤", "🎧", "🎷"]
  };
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Smileys");

  // Fetch GIFs from Giphy
  useEffect(() => {
    if (emojiPickerTab !== 'gif') return;

    // No search — show trending
    if (!gifSearch.trim()) {
      let cancelled = false;
      setIsLoadingGifs(true);
      (async () => {
        try {
          const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=cw6S767E6c91sVfF50A9499824fF9&limit=20&rating=g`);
          const data = await res.json();
          if (!cancelled) setGifs(data.data || []);
        } finally {
          if (!cancelled) setIsLoadingGifs(false);
        }
      })();
      return () => { cancelled = true; };
    }

    // Debounced search
    setIsLoadingGifs(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=cw6S767E6c91sVfF50A9499824fF9&q=${gifSearch}&limit=20&offset=0&rating=g&lang=en`);
        const data = await res.json();
        setGifs(data.data || []);
      } finally {
        setIsLoadingGifs(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [gifSearch, emojiPickerTab]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeView === 'chat') {
      // Use requestAnimationFrame to ensure DOM is updated before scrolling
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [chatHistory, activeView, chatMode, selectedFriend]);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [sentMessages, setSentMessages] = useState({});
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [lastSearchedId, setLastSearchedId] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [profileFriend, setProfileFriend] = useState(null);

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      // Guard: Don't load if user already logged out or session dead
      if (!currentUser) return;
      
      try {
        setLoadingFriends(true);
        const [friendsData, notificationsData, suggestionsData] = await Promise.all([
          friendsApi.getAll(),
          notificationsApi.getAll(),
          friendsApi.search('')
        ]);
        setFriends(friendsData);
        setNotifications(notificationsData);
        setSuggestedUsers(suggestionsData);
      } catch (_err) {
        console.error('Failed to load friends/notifications:', _err);
        // Only show error toast if it's NOT a 401. 401 is handled by global logout.
        if (addToast && _err?.response?.status !== 401) {
          addToast('Failed to load your social data', 'danger');
        }
      } finally {
        setLoadingFriends(false);
      }
    };
    loadData();
  }, [addToast, currentUser]);

  // Socket Listeners
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handleNewNotification = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        if (addToast) addToast(notif.content, 'info');
      };

      const handleNewMessage = (msg) => {
        // Find which friend this message belongs to
        const friend = friends.find(f => f.dmRoomId === msg.roomId) || (selectedFriend?.dmRoomId === msg.roomId ? selectedFriend : null);
        
        if (friend) {
          const friendId = friend._id || friend.id;
          const currentUserId = currentUser?._id || currentUser?.id;
          
          // Map to frontend message format
          const formattedMsg = {
            ...msg,
            sender: String(msg.senderId) === String(currentUserId) ? 'me' : 'them',
            time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setChatHistory(prev => {
            const hists = prev[friendId] || [];
            // Avoid duplicates (e.g. if we get the message we just sent via socket too)
            if (hists.some(m => m.id === msg.id)) return prev;
            
            return {
              ...prev,
              [friendId]: [...hists, formattedMsg]
            };
          });

          // If we are currently looking at this chat, mark it as read
          if (selectedFriend && selectedFriend.dmRoomId === msg.roomId && activeView === 'chat') {
            messagesApi.markAsRead(msg.roomId).catch(() => {});
          }
        }
      };

      const handleMessagesRead = ({ roomId, readerId }) => {
        const friend = friends.find(f => f.dmRoomId === roomId) || (selectedFriend?.dmRoomId === roomId ? selectedFriend : null);
        if (friend) {
          const friendId = friend._id || friend.id;
          const currentUserId = currentUser?._id || currentUser?.id;
          
          if (String(readerId) !== String(currentUserId)) {
            setChatHistory(prev => ({
              ...prev,
              [friendId]: (prev[friendId] || []).map(m => m.sender === 'me' ? { ...m, isRead: true } : m)
            }));
          }
        }
      };

      const handleStatusChange = ({ userId, isOnline }) => {
        setFriends(prev => prev.map(f => (f._id === userId || f.id === userId) ? { ...f, isOnline } : f));
        setSelectedFriend(prev => {
          if (prev && (prev._id === userId || prev.id === userId)) {
            return { ...prev, isOnline };
          }
          return prev;
        });
      };

      socket.on('new_notification', handleNewNotification);
      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
      socket.on('user_status_change', handleStatusChange);

      return () => {
        socket.off('new_notification', handleNewNotification);
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
        socket.off('user_status_change', handleStatusChange);
      };
    }
  }, [selectedFriend, friends, currentUser, activeView, addToast]);

  // Load chat history when switching to chat
  useEffect(() => {
    if (activeView === 'chat' && selectedFriend?.dmRoomId) {
      const roomId = selectedFriend.dmRoomId;
      const socket = getSocket();
      
      if (socket) socket.emit('join_room', roomId);
      messagesApi.markAsRead(roomId).catch(() => {});
      
      const friendId = selectedFriend._id || selectedFriend.id;

      const loadHistory = async () => {
        // Skip re-fetching if we already have history for this session
        if (loadedChats.has(roomId)) return;

        try {
          const response = await messagesApi.getByRoom(roomId);
          
          const currentUserId = currentUser?._id || currentUser?.id;
          const formattedMessages = (response?.messages || []).map(msg => ({
            ...msg,
            sender: String(msg.senderId) === String(currentUserId) ? 'me' : 'them',
            time: new Date(msg.timestamp || msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          setChatHistory(prev => ({
            ...prev,
            [friendId]: formattedMessages
          }));
          setLoadedChats(prev => new Set([...prev, roomId]));
        } catch (err) {
          console.error('Failed to load chat history:', err);
        }
      };
      loadHistory();

      return () => {
        if (socket) socket.emit('leave_room', roomId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedFriend]);

  // Scroll to bottom on new messages or view change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [message, activeView, selectedFriend]); // Removed chatHistory to avoid recursive scroll loops

  const filteredFriends = (Array.isArray(friends) ? friends : []).filter(f =>
    ((f.name || f.username || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFriends = filteredFriends.reduce((acc, friend) => {
    const group = friend.isOnline ? 'Active Now' : 'Offline';
    if (!acc[group]) acc[group] = [];
    acc[group].push(friend);
    return acc;
  }, {});

  const { initiateCall, callState } = useVideoCall();

  const openChat = (friend, mode = 'text') => {
    // If we're in profile view and click message, or from list
    setSelectedFriend(friend);
    if (mode === 'video' || mode === 'voice') {
      initiateCall({
        id: friend._id || friend.id,
        name: friend.name,
        avatar: friend.avatar,
        tag: friend.tag
      });
      return;
    }
    setChatMode(mode);
    setActiveView('chat');
  };

  const handleShowProfile = (friend) => {
    setProfileFriend(friend);
    setActiveView('profile');
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedFriend) return;
    const content = message.trim();
    setMessage('');
    setShowEmojiPicker(false);

    try {
      if (selectedFriend.dmRoomId) {
        await messagesApi.send(selectedFriend.dmRoomId, { content });
      }
    } catch {
      if (addToast) addToast('Failed to send message', 'danger');
    }
  };

  const sendGif = async (gif) => {
    if (!selectedFriend || !selectedFriend.dmRoomId) return;
    const gifUrl = gif.images.fixed_height.url;
    
    try {
      await messagesApi.send(selectedFriend.dmRoomId, { 
        type: 'gif',
        fileData: { 
          url: gifUrl, 
          name: 'GIF',
          size: 0 
        }
      });
      setShowEmojiPicker(false);
      setGifSearch('');
    } catch {
      if (addToast) addToast('Failed to send GIF', 'danger');
    }
  };

  const sendSticker = async (stickerUrl) => {
    if (!selectedFriend || !selectedFriend.dmRoomId) return;
    
    try {
      await messagesApi.send(selectedFriend.dmRoomId, { 
        type: 'sticker',
        fileData: { 
          url: stickerUrl, 
          name: 'Sticker',
          size: 0
        }
      });
      setShowEmojiPicker(false);
    } catch {
      if (addToast) addToast('Failed to send sticker', 'danger');
    }
  };

  const STICKERS = [
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f92a/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f643/512.gif"
  ];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Dynamic MIME type detection
        const possibleTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        const mimeType = possibleTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
        
        // Explicit bitrate for better clarity
        mediaRecorder.current = new MediaRecorder(stream, { 
          mimeType,
          audioBitsPerSecond: 128000 
        });
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunks.current.push(e.data);
          }
        };

        mediaRecorder.current.onstop = async () => {
          const actualMimeType = mediaRecorder.current.mimeType;
          const audioBlob = new Blob(audioChunks.current, { type: actualMimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result;
            if (selectedFriend?.dmRoomId) {
              await messagesApi.send(selectedFriend.dmRoomId, {
                content: 'Voice Message',
                type: 'voice',
                fileData: { 
                  url: base64Audio, 
                  name: `voice_note.${actualMimeType.split('/')[1].split(';')[0]}`, 
                  mimeType: actualMimeType 
                }
              });
              if (addToast) addToast('Voice note sent!', 'success');
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };

        // Use 100ms timeslice to ensure data is pushed frequently
        mediaRecorder.current.start(100);
        setIsRecording(true);
      } catch (err) {
        console.error('Recording failed:', err);
        if (addToast) addToast('Microphone access denied or recording error', 'danger');
      }
    } else {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && selectedFriend?.dmRoomId) {
      try {
        if (addToast) addToast('Uploading file...', 'info');
        
        // 1. Upload to server
        const uploadedFile = await messagesApi.uploadFile(file);
        
        // 2. Send message with the returned URL
        await messagesApi.send(selectedFriend.dmRoomId, {
          content: `Sent file: ${file.name}`,
          type: uploadedFile.mimeType?.startsWith('image/') ? 'image' : 'file',
          fileData: { 
            url: uploadedFile.url,
            name: uploadedFile.name, 
            size: uploadedFile.size,
            mimeType: uploadedFile.mimeType
          }
        });
        
        if (addToast) addToast('File sent successfully!', 'success');
      } catch (err) {
        console.error('Upload failed:', err);
        if (addToast) addToast('Failed to upload file', 'danger');
      }
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
      const data = await friendsApi.search(newFriendName);
      // Ensure we handle non-array returns or empty results gracefully
      const results = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data)) ? data.data : [];
      setSearchResults(results.length > 0 ? results : 'none');
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults('none');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSuggested = async (user) => {
    try {
      await friendsApi.sendRequest(user._id || user.id);
      setPendingRequests(prev => new Set([...prev, user._id || user.id]));
      if (addToast) addToast('Request sent!', 'success');
    } catch (err) {
      if (addToast) addToast(err.response?.data?.message || 'Failed to send request', 'danger');
    }
  };

  const addFoundFriend = async (user) => {
    try {
      await friendsApi.sendRequest(user._id || user.id);
      setPendingRequests(prev => new Set([...prev, user._id || user.id]));
      if (addToast) addToast('Request sent!', 'success');
    } catch (err) {
      if (addToast) addToast(err.response?.data?.message || 'Failed to send request', 'danger');
    }
  };

  const acceptRequest = async (notif) => {
    try {
      await friendsApi.acceptRequest(notif.relatedId || notif.requestId);
      setNotifications(prev => (Array.isArray(prev) ? prev : []).filter(n => n.id !== notif.id));
      if (addToast) addToast('Friend request accepted!', 'success');
      // Refresh friends
      const data = await friendsApi.getAll();
      const friendsList = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data)) ? data.data : [];
      setFriends(friendsList);
    } catch {
      if (addToast) addToast('Failed to accept request', 'danger');
    }
  };

  const declineRequest = async (notif) => {
    try {
      await friendsApi.declineRequest(notif.relatedId || notif.requestId);
      setNotifications(prev => (Array.isArray(prev) ? prev : []).filter(n => n.id !== notif.id));
      if (addToast) addToast('Request declined', 'info');
    } catch {
      if (addToast) addToast('Failed to decline request', 'danger');
    }
  };

  const filteredSuggestions = (Array.isArray(suggestedUsers) ? suggestedUsers : []).filter(u => 
    !(Array.isArray(friends) ? friends : []).some(f => (f._id || f.id) === (u._id || u.id))
  );


  const handleSuggestionMessageClick = (user) => {
    if (activeMessageId === user.id) {
      setActiveMessageId(null);
      return;
    }
    const currentCount = sentMessages[user.id] || 0;
    const isFriend = friends.some(f => (f.name || f.username) === user.name);
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





  if (activeView === 'chat' && selectedFriend) {
    const friendId = selectedFriend._id || selectedFriend.id;
    const currentChat = Array.isArray(chatHistory[friendId]) ? chatHistory[friendId] : [];

    return (
      <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-md z-[150] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-brand-surface w-full max-w-md h-full sm:h-[85vh] sm:rounded-[40px] border-0 sm:border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-inter" onClick={(e) => e.stopPropagation()}>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} onClick={(e) => e.stopPropagation()} />
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-brand-border/50 flex items-center justify-between bg-brand-bg/50 backdrop-blur-2xl shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button onClick={() => setActiveView('list')} className="p-2 hover:bg-brand-muted/20 rounded-full transition-all active:scale-90 shrink-0">
                <ArrowLeft size={20} className="text-brand-text sm:w-[22px]" />
              </button>
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-brand-muted rounded-full flex items-center justify-center font-black text-brand-text shadow-lg text-sm sm:text-base overflow-hidden border border-brand-border/50">
                  {selectedFriend.avatar && selectedFriend.avatar.startsWith('data:image') || selectedFriend.avatar?.startsWith('http') ? (
                    <img src={selectedFriend.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="opacity-80">{(selectedFriend.name || selectedFriend.username || '?')[0].toUpperCase()}</span>
                  )}
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
              <button 
                onClick={() => initiateCall({ 
                  id: selectedFriend._id || selectedFriend.id, 
                  name: selectedFriend.name, 
                  avatar: selectedFriend.avatar,
                  tag: selectedFriend.tag 
                }, 'voice')} 
                disabled={callState !== 'idle'}
                className="p-2 sm:p-2.5 rounded-xl transition-all shrink-0 text-brand-text-dim hover:bg-brand-muted/20 disabled:opacity-30"
              >
                <PhoneCall size={16} sm:size={18} />
              </button>
              <button 
                onClick={() => initiateCall({ 
                  id: selectedFriend._id || selectedFriend.id, 
                  name: selectedFriend.name, 
                  avatar: selectedFriend.avatar,
                  tag: selectedFriend.tag 
                })} 
                disabled={callState !== 'idle'}
                className="p-2 sm:p-2.5 rounded-xl transition-all shrink-0 text-brand-text-dim hover:bg-brand-muted/20 disabled:opacity-30"
              >
                <Video size={18} sm:size={20} />
              </button>
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
                        <div className={`${msg.type === 'sticker' ? 'p-0' : 'p-4 rounded-[24px] shadow-lg border border-brand-border/50'} ${msg.sender === 'me'
                          ? (msg.type === 'sticker' ? '' : 'bg-brand-primary text-white rounded-tr-none')
                          : (msg.type === 'sticker' ? '' : 'bg-brand-surface text-brand-text rounded-tl-none')
                          }`}>
                          {msg.type === 'voice' ? (
                            <AudioMessage url={msg.fileData?.url} isMe={msg.sender === 'me'} />
                          ) : msg.type === 'text' ? (
                            <MessageContent text={msg.content || msg.text} />
                          ) : null}
                          
                          {msg.type === 'file' && (
                            <a 
                              href={msg.fileData?.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 mt-2 px-4 py-3 bg-black/10 hover:bg-black/20 rounded-xl transition-all border border-white/10 group no-underline"
                            >
                              <div className="w-10 h-10 rounded-lg bg-brand-primary/20 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/30 transition-colors">
                                <FileText size={20} className="text-brand-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-brand-text truncate mb-0.5">{msg.fileData?.name || 'Attachment'}</p>
                                <p className="text-[10px] text-brand-text-dim uppercase tracking-tighter">
                                  {msg.fileData?.size ? `${(msg.fileData.size / 1024).toFixed(1)} KB` : 'Click to Download'}
                                </p>
                              </div>
                            </a>
                          )}

                          {['image', 'gif', 'sticker'].includes(msg.type) && msg.fileData?.url && (
                             <div className={`${msg.type === 'sticker' ? 'bg-transparent' : 'mt-2 rounded-xl overflow-hidden border border-white/10 shadow-inner'}`}>
                               <img 
                                 src={msg.fileData.url} 
                                 alt={msg.fileData.name} 
                                 className={`${msg.type === 'sticker' ? 'w-32 h-32' : 'max-w-full h-auto'} cursor-pointer hover:scale-105 transition-transform duration-300`}
                                 onClick={() => window.open(msg.fileData.url, '_blank')}
                               />
                             </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-black mt-2 inline-block uppercase tracking-widest opacity-70 ${msg.sender === 'me' ? 'text-brand-secondary mr-1' : 'text-brand-text-dim ml-1'}`}>
                          {msg.time} {msg.sender === 'me' && `• ${msg.isRead ? 'READ' : 'SENT'}`}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Tabbed Picker Overlay */}
                {showEmojiPicker && (
                  <div className="absolute bottom-24 left-6 right-6 bg-brand-surface border border-brand-border rounded-3xl z-50 animate-in slide-in-from-bottom-4 shadow-2xl overflow-hidden flex flex-col h-80">
                    <div className="flex border-b border-brand-border/50 bg-brand-muted/10 shrink-0">
                      <button onClick={() => setEmojiPickerTab('emoji')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${emojiPickerTab === 'emoji' ? 'text-brand-text bg-brand-muted/20' : 'text-brand-text-dim hover:text-brand-text'}`}>Emojis</button>
                      <button onClick={() => setEmojiPickerTab('sticker')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${emojiPickerTab === 'sticker' ? 'text-brand-text bg-brand-muted/20' : 'text-brand-text-dim hover:text-brand-text'}`}>Stickers</button>
                      <button onClick={() => setEmojiPickerTab('gif')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${emojiPickerTab === 'gif' ? 'text-brand-text bg-brand-muted/20' : 'text-brand-text-dim hover:text-brand-text'}`}>GIFs</button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {emojiPickerTab === 'emoji' && (
                        <div className="flex flex-col h-full"> 
                          {/* Categories */}
                          <div className="flex gap-2 p-3 border-b border-brand-border/30 overflow-x-auto scrollbar-hide shrink-0">
                            {Object.keys(EMOJI_DATA).map(cat => (
                              <button 
                                key={cat} 
                                onClick={() => setActiveEmojiCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeEmojiCategory === cat ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-muted/10 text-brand-text-dim hover:text-brand-text'}`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          {/* Grid */}
                          <div className="grid grid-cols-6 gap-3 p-4">
                            {EMOJI_DATA[activeEmojiCategory].map(e => (
                              <button key={e} onClick={() => { addEmoji(e); setShowEmojiPicker(false); }} className="text-2xl hover:scale-125 transition-transform p-1">
                                {e}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {emojiPickerTab === 'sticker' && (
                        <div className="grid grid-cols-3 gap-4 p-4">
                          {STICKERS.map((s, i) => (
                            <button 
                              key={i} 
                              onClick={() => sendSticker(s)}
                              className="aspect-square bg-brand-muted/5 rounded-2xl flex items-center justify-center hover:bg-brand-muted/10 transition-all border border-brand-border/30 group overflow-hidden"
                            >
                              <img src={s} alt="sticker" className="w-16 h-16 group-hover:scale-110 transition-transform" />
                            </button>
                          ))}
                        </div>
                      )}

                      {emojiPickerTab === 'gif' && (
                        <div className="flex flex-col h-full">
                          <div className="p-3 border-b border-brand-border/30 sticky top-0 bg-brand-surface shrink-0">
                            <div className="relative group">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary" size={14} />
                              <input 
                                type="text"
                                placeholder="Search GIPHY..."
                                value={gifSearch}
                                onChange={(e) => setGifSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-brand-bg/50 border border-brand-border/50 rounded-xl text-[11px] text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 p-2">
                            {isLoadingGifs ? (
                              <div className="col-span-2 flex flex-col items-center justify-center py-12 space-y-3 opacity-50">
                                <Loader className="animate-spin text-brand-primary" size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Searching GIPHY...</span>
                              </div>
                            ) : (
                              gifs.map(g => (
                                <button key={g.id} onClick={() => sendGif(g)} className="aspect-video bg-brand-muted/5 rounded-xl overflow-hidden hover:opacity-80 transition-opacity">
                                  <img src={g.images.fixed_height.url} alt="gif" className="w-full h-full object-cover" />
                                </button>
                              ))
                            )}
                          </div>
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
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'profile' && profileFriend) {
    return (
      <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl z-[150] flex items-center justify-center p-0 sm:p-8 overflow-hidden animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-brand-surface w-full max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-[40px] border-0 sm:border border-brand-border/30 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Header/Back */}
            <div className="p-6 flex items-center justify-between sticky top-0 bg-brand-surface/80 backdrop-blur-md z-10">
              <button onClick={() => setActiveView('list')} className="p-2 hover:bg-brand-muted/20 rounded-full transition-all active:scale-90">
                <ArrowLeft size={24} className="text-brand-text" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-brand-muted/20 rounded-full transition-all">
                <X size={24} className="text-brand-text-dim" />
              </button>
            </div>

            <div className="px-6 sm:px-12 pb-12">
              {/* Top Info */}
              <div className="flex flex-col items-center text-center space-y-4 mb-10">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-brand-bg rounded-[32px] sm:rounded-[40px] flex items-center justify-center border-4 border-brand-border shadow-2xl overflow-hidden group">
                    {profileFriend.avatar ? (
                      <img src={profileFriend.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                      <span className="text-4xl sm:text-5xl font-black text-brand-muted">
                        {(profileFriend.name || profileFriend.username || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-2xl border-4 border-brand-surface flex items-center justify-center ${profileFriend.isOnline ? 'bg-brand-success' : 'bg-brand-muted'}`}>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse opacity-50"></div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-brand-text uppercase tracking-tight leading-none mb-2">{profileFriend.name || profileFriend.username}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">#{profileFriend.tag || '0000'}</span>
                    <span className="w-1 h-1 bg-brand-border rounded-full"></span>
                    <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">{profileFriend.isOnline ? 'Active Now' : 'Currently Offline'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button 
                    onClick={() => openChat(profileFriend)}
                    className="px-8 py-3 bg-brand-text text-brand-bg rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95"
                  >
                    Message
                  </button>
                  <button 
                    onClick={() => openChat(profileFriend, 'voice')}
                    className="w-12 h-12 bg-brand-muted/20 text-brand-text hover:bg-brand-primary hover:text-white rounded-2xl flex items-center justify-center transition-all border border-brand-border"
                  >
                    <PhoneCall size={18} />
                  </button>
                </div>
              </div>

              {/* Profile Content Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Education */}
                <div className="p-6 bg-brand-card/50 rounded-[32px] border border-brand-border/30 space-y-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <GraduationCap size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Education</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-brand-text uppercase leading-tight">{profileFriend.institution || 'No Institution Set'}</p>
                    <p className="text-[10px] font-bold text-brand-text-dim uppercase mt-1 tracking-widest">{profileFriend.course || 'Course details hidden'}</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="p-6 bg-brand-card/50 rounded-[32px] border border-brand-border/30 space-y-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Code2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Technical Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileFriend.skills?.length > 0 ? profileFriend.skills.map(skill => (
                      <span key={skill} className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary text-[9px] font-black uppercase tracking-tighter rounded-full border border-brand-primary/20">
                        {skill}
                      </span>
                    )) : <p className="text-[9px] font-bold text-brand-text-dim uppercase">No skills added</p>}
                  </div>
                </div>

                {/* Interests */}
                <div className="p-6 bg-brand-card/50 rounded-[32px] border border-brand-border/30 space-y-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Heart size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Interests</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profileFriend.interests?.length > 0 ? profileFriend.interests.map(interest => (
                      <span key={interest} className="px-2.5 py-1 bg-white/5 text-brand-text text-[9px] font-black uppercase tracking-tighter rounded-full border border-brand-border/40">
                        {interest}
                      </span>
                    )) : <p className="text-[9px] font-bold text-brand-text-dim uppercase">No interests listed</p>}
                  </div>
                </div>

                {/* Socials */}
                <div className="p-6 bg-brand-card/50 rounded-[32px] border border-brand-border/30 space-y-4">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Sparkles size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Connect</span>
                  </div>
                  <div className="flex gap-3">
                    {['github', 'linkedin', 'twitter', 'instagram'].map(platform => {
                      const Icons = { github: Github, linkedin: Linkedin, twitter: Twitter, instagram: Instagram };
                      const Icon = Icons[platform];
                      const link = profileFriend.socials?.[platform];
                      return (
                        <a 
                          key={platform}
                          href={link ? (link.startsWith('http') ? link : `https://${platform}.com/${link}`) : '#'}
                          target={link ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${link ? 'bg-brand-surface text-brand-text hover:bg-brand-primary hover:text-white border-brand-primary/30' : 'bg-brand-surface/30 text-brand-text-dim pointer-events-none opacity-30'} border`}
                        >
                          <Icon size={18} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl z-[150] flex items-center justify-center p-0 sm:p-8 overflow-hidden animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-brand-surface w-full max-w-5xl h-[100dvh] sm:h-[85vh] rounded-none sm:rounded-[40px] border-0 sm:border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 font-sans" onClick={(e) => e.stopPropagation()}>

        <div className="px-3.5 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-brand-border/50 bg-brand-bg/50 backdrop-blur-xl shrink-0 gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-6 shrink-0">
            <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-brand-muted/20 rounded-full transition-all shrink-0">
              <ArrowLeft size={18} className="text-brand-text sm:w-6 sm:h-6" />
            </button>
            <h2 className="hidden xs:block text-[15px] sm:text-2xl font-black text-brand-text tracking-tight uppercase truncate">Friends</h2>
          </div>
          {!showAddFriend && (
            <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end min-w-0">
              <div className="relative group flex-1 max-w-[200px] sm:max-w-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-primary transition-colors" size={14} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-brand-bg border border-brand-border/80 rounded-xl text-[11px] text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary placeholder:text-brand-muted transition-all font-bold sm:w-64"
                />
              </div>
              <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                <div className="flex bg-brand-bg rounded-2xl p-1 border border-brand-border/30">
                  <button
                    onClick={() => setActiveTab('friends')}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'friends' ? 'bg-brand-text text-brand-bg shadow-lg' : 'text-brand-text-dim hover:text-brand-text'}`}
                  >
                    Friends
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'requests' ? 'bg-brand-text text-brand-bg shadow-lg' : 'text-brand-text-dim hover:text-brand-text'}`}
                  >
                    Requests
                    {notifications.filter(n => 
                      n.type === 'FRIEND_REQUEST' && 
                      !friends.some(f => (f._id || f.id) === (n.sender?._id || n.sender?.id))
                    ).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[8px] flex items-center justify-center rounded-full border-2 border-brand-bg animate-pulse">
                        {notifications.filter(n => 
                          n.type === 'FRIEND_REQUEST' && 
                          !friends.some(f => (f._id || f.id) === (n.sender?._id || n.sender?.id))
                        ).length}
                      </span>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="hidden sm:block text-brand-text font-black text-[11px] uppercase tracking-widest hover:text-brand-primary transition-colors bg-brand-muted/20 px-4 py-2 rounded-xl border border-brand-border shrink-0"
                >
                  Add Friends
                </button>
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="sm:hidden p-2 bg-brand-muted/20 text-brand-text rounded-xl border border-brand-border"
                >
                  <UserPlus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-brand-bg relative">
          {/* Left Side: Friends List */}
          <div className="w-full flex-1 flex flex-col border-r border-brand-border/30 shrink-0 md:shrink md:overflow-hidden md:min-h-0">
            {showAddFriend && (
              <div className="px-4 sm:px-6 py-4 bg-brand-bg/50 backdrop-blur-xl border-b border-brand-border/30 animate-in slide-in-from-top duration-300">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    autoFocus
                    value={newFriendName}
                    onChange={(e) => { setNewFriendName(e.target.value); if (searchResults) setSearchResults(null); }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter Unique UserID"
                    className="w-full max-w-[260px] min-w-0 bg-brand-muted/20 border border-brand-border/50 rounded-xl px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-primary font-bold placeholder:text-brand-muted/60"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-text hover:bg-white text-brand-bg text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {isSearching ? <Loader size={14} className="animate-spin" /> : 'Search'}
                  </button>
                  <button 
                    onClick={() => { setShowAddFriend(false); setSearchResults(null); setNewFriendName(''); }} 
                    className="shrink-0 px-2 sm:px-3 py-2 sm:py-2.5 text-brand-text-dim hover:text-brand-text text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {!showAddFriend ? (
              <div className="md:flex-1 overflow-visible md:overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 custom-scrollbar bg-brand-bg flex flex-col">
            {loadingFriends ? (
              <FriendListSkeleton count={5} />
            ) : activeTab === 'friends' ? (
                  Object.keys(groupedFriends).sort().length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] opacity-60">
                      <User size={64} className="text-brand-muted mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">No Friends Found</p>
                    </div>
                  ) : (
                    Object.keys(groupedFriends).sort((a, b) => {
                      if (a === 'Active Now') return -1;
                      if (b === 'Active Now') return 1;
                      return a.localeCompare(b);
                    }).map(group => (
                      <div key={group} className="space-y-3 sm:space-y-4 mb-6">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <h3 className="text-[9px] sm:text-[10px] font-bold text-brand-muted tracking-[0.2em] sm:tracking-[0.3em] uppercase">{group}</h3>
                          <div className="flex-1 h-px bg-brand-border/10"></div>
                        </div>
                        <div className="space-y-3">
                          {groupedFriends[group].map((friend) => (
                            <FriendItem
                              key={friend._id || friend.id}
                              friend={friend}
                              onChat={() => openChat(friend)}
                              onCall={() => openChat(friend, 'voice')}
                              onProfile={() => handleShowProfile(friend)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* Requests Tab */
                  notifications.filter(n => 
                    n.type === 'FRIEND_REQUEST' && 
                    !friends.some(f => (f._id || f.id) === (n.sender?._id || n.sender?.id))
                  ).length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] opacity-60">
                      <Bell size={64} className="text-brand-muted mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">No Pending Requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.filter(n => 
                        n.type === 'FRIEND_REQUEST' && 
                        !friends.some(f => (f._id || f.id) === (n.sender?._id || n.sender?.id))
                      ).map((notif) => (
                        <div key={notif.id} className="bg-brand-card border border-brand-border/50 rounded-3xl p-5 flex items-center justify-between shadow-xl animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center border-2 border-brand-border text-brand-primary text-xl font-black overflow-hidden shadow-premium">
                              {notif.sender?.avatar ? <img src={notif.sender.avatar} className="w-full h-full object-cover" /> : (notif.sender?.name || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-brand-text uppercase tracking-tight">{notif.sender?.name || 'Unknown User'}</h4>
                              <p className="text-[8px] font-bold text-brand-text-dim uppercase tracking-widest">Wants to collaborate</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => acceptRequest(notif)}
                              className="w-10 h-10 bg-brand-text hover:bg-brand-primary text-brand-bg rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                            >
                              <UserCheck size={20} />
                            </button>
                            <button
                              onClick={() => declineRequest(notif)}
                              className="w-10 h-10 bg-brand-bg hover:bg-brand-danger text-brand-text-dim hover:text-white rounded-full flex items-center justify-center border border-brand-border transition-all active:scale-90"
                            >
                              <ShieldClose size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-start pt-4 sm:pt-6 px-4 sm:px-8 bg-brand-surface animate-in fade-in zoom-in-95 duration-500 overflow-y-auto">
                {searchResults === null ? (
                  <div className="hidden sm:flex flex-col items-center pt-10">
                    <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/20 mb-8 shadow-2xl">
                      <UserPlus size={48} className="text-brand-primary" />
                    </div>
                    <h3 className="text-2xl font-black text-brand-text uppercase mb-3 tracking-tighter text-center">Expand the Network</h3>
                    <p className="text-[11px] font-bold text-brand-text-dim uppercase tracking-[0.2em] max-w-[280px] leading-relaxed text-center">
                      Connect with collaborators by entering their User ID above.
                    </p>
                  </div>
                ) : searchResults === 'none' ? (
                  <div className="text-center py-6 sm:py-10">
                    <div className="hidden sm:flex w-20 h-20 bg-brand-muted/10 rounded-full items-center justify-center border border-brand-border/30 mb-6 mx-auto">
                      <X size={32} className="text-brand-muted" />
                    </div>
                    <h4 className="text-lg font-black text-brand-text uppercase tracking-tight mb-2">ID Not Found</h4>
                    <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">The User ID "{lastSearchedId}" does not exist.</p>
                  </div>
                ) : (
                  <div className="w-full max-w-md space-y-3 animate-in slide-in-from-bottom-2 duration-300 pt-2 sm:pt-0">
                    <div className="flex items-center gap-2 mb-4 sm:hidden">
                      <Users size={16} className="text-brand-primary" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-text">Search Result</h4>
                    </div>
                    {Array.isArray(searchResults) && searchResults.map(user => (
                      <div key={user.id} className="bg-brand-card border border-brand-border rounded-[24px] p-4 flex items-center justify-between group/result shadow-xl hover:border-brand-primary/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center border border-brand-border text-xl font-black text-brand-text shadow-lg overflow-hidden">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user.full_name || user.username || '?')[0].toUpperCase()}
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
          {showAddFriend && (
            <div className="w-full md:flex-1 bg-brand-surface/40 backdrop-blur-md flex flex-col shrink-0 md:overflow-hidden border-t md:border-t-0 md:border-l border-brand-border/20">
              <div className="py-6 px-6 border-b border-brand-border/30 bg-gradient-to-br from-brand-primary/10 via-transparent to-transparent shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-brand-primary drop-shadow-[0_0_8px_rgba(201,181,156,0.3)]" size={18} />
                  <h3 className="text-lg font-black text-brand-text tracking-tight uppercase">Suggested For You</h3>
                </div>
              </div>


              <div className="flex-1 overflow-y-auto pt-2 px-6 pb-6 space-y-3 custom-scrollbar flex flex-col">
                {filteredSuggestions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-70">
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
          )}
        </div>

      </div>
    </div>
  );
}

export default FriendsModal;
