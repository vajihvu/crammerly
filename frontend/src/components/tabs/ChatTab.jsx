// src/components/tabs/ChatTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, Mic, X, Plus, MessageCircle, Paperclip, Smile, FileText, Play, Pause, Headphones } from 'lucide-react';
import { messagesApi } from '../../api';
import { getSocket, joinRoom, leaveRoom } from '../../utils/socket';
import { ChatSkeleton, NetworkError } from '../ui/Skeletons';

const AudioMessage = ({ url, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 ${isMe ? 'bg-white/20' : 'bg-brand-muted/20'} rounded-2xl min-w-[200px]`}>
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMe ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'}`}
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
      </button>
      <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden relative">
        <div className={`absolute inset-y-0 left-0 ${isMe ? 'bg-white' : 'bg-brand-primary'} w-1/3 rounded-full`} />
      </div>
      <Headphones size={14} className="opacity-50" />
      <audio 
        ref={audioRef} 
        src={url} 
        onEnded={() => setIsPlaying(false)} 
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden" 
      />
    </div>
  );
};

const MessageContent = ({ text }) => {
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

function ChatTab({ room, currentUser, addToast }) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [messagesError, setMessagesError] = useState(null);

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '🚀', '💪', '🧠', '📚', '✅', '👏', '🙌', '💡', '⭐', '🎯', '👀', '😎'];
  const gifs = [
    { id: 1, url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', name: 'Celebrate' },
    { id: 2, url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif', name: 'High Five' },
    { id: 3, url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', name: 'Thinking' },
    { id: 4, url: 'https://media.giphy.com/media/3o7absbD7PbTFQa0c8/giphy.gif', name: 'Coding' }
  ];
  const stickers = ['🎓', '📖', '💻', '🖊️', '📝', '🎯', '⚡', '🌟', '🏆', '🔔', '📊', '🎨', '🔬', '🧪', '📐', '🔢'];

  useEffect(() => {
    // 1. Initial Fetch
    const loadMessages = async () => {
      setLoadingMessages(true);
      setMessagesError(null);
      try {
        const data = await messagesApi.getAll(room.id);
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        setMessagesError('Failed to load messages');
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();

    // 2. Socket.io for updates
    joinRoom(room.id);
    const socket = getSocket();

    if (socket) {
      const handleNewMessage = (newMsg) => {
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      };

      socket.on('new_message', handleNewMessage);

      return () => {
        socket.off('new_message', handleNewMessage);
        leaveRoom(room.id);
      };
    }
  }, [room.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await messagesApi.send(room.id, { content: message.trim(), type: 'text' });
      setMessage('');
      setShowEmojiPicker(false);
    } catch (err) {
      if (addToast) addToast('Failed to send message', 'danger');
      console.error('Send message error:', err);
    }
  };

  const handleVoiceRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.current.push(e.data);
        };

        mediaRecorder.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result;
            try {
               await messagesApi.send(room.id, {
                 content: 'Voice Message',
                 type: 'voice',
                 fileData: { url: base64Audio, name: 'voice_note.webm', mimeType: 'audio/webm' }
               });
               if (addToast) addToast('Voice note sent!', 'success');
            } catch (err) {
               console.error('Failed to send voice message:', err);
               if (addToast) addToast('Failed to send voice message', 'danger');
            }
          };
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Microphone error:', err);
        if (addToast) addToast('Microphone access denied', 'danger');
      }
    } else {
      mediaRecorder.current?.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      if (addToast) {
        addToast('File size must be less than 10MB', 'danger');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: event.target.result
      };
      try {
        await messagesApi.send(room.id, { content: `Shared file: ${file.name}`, type: 'file', fileData });
      } catch (err) {
        console.error('File send error:', err);
        if (addToast) addToast('Failed to send file', 'danger');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (emoji) => {
    setMessage(message + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifClick = async (gif) => {
    try {
      await messagesApi.send(room.id, { content: gif.name, type: 'gif', fileData: gif });
    } catch (err) {
      console.error('GIF send error:', err);
      if (addToast) addToast('Failed to send GIF', 'danger');
    }
    setShowGifPicker(false);
  };

  const handleStickerClick = async (sticker) => {
    try {
      await messagesApi.send(room.id, { content: sticker, type: 'sticker' });
    } catch (err) {
      console.error('Sticker send error:', err);
      if (addToast) addToast('Failed to send sticker', 'danger');
    }
    setShowStickerPicker(false);
  };

  const filteredMessages = Array.isArray(messages) && showSearch && searchTerm.trim()
    ? messages.filter(msg =>
      (msg.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.senderName || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    : (Array.isArray(messages) ? messages : []);

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border flex flex-col flex-1 min-h-0 h-full overflow-hidden">
      <div className="p-3 border-b border-brand-border bg-brand-surface/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm">Chat Messages</h3>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-all ${showSearch ? 'bg-brand-primary text-white' : 'bg-brand-muted/20 text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/40'}`}
          >
            <Search size={16} />
          </button>
        </div>
        {showSearch && (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-brand-bg rounded-lg border border-brand-border focus:outline-none focus:ring-1 focus:ring-brand-primary text-brand-text"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 flex flex-col">
        {loadingMessages ? (
          <ChatSkeleton />
        ) : messagesError ? (
          <NetworkError message={messagesError} onRetry={() => {
            setLoadingMessages(true);
            setMessagesError(null);
            messagesApi.getAll(room.id).then(data => { setMessages(data); setLoadingMessages(false); }).catch(() => { setMessagesError('Failed to load messages'); setLoadingMessages(false); });
          }} />
        ) : Array.isArray(filteredMessages) && filteredMessages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>{showSearch && searchTerm ? 'No messages found' : 'No messages yet. Start chatting!'}</p>
          </div>
        ) : Array.isArray(filteredMessages) ? (
          filteredMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.sender_id === currentUser.id ? 'bg-brand-primary text-brand-bg shadow-accent' : 'bg-brand-surface border border-brand-border text-brand-text'} rounded-2xl p-4 shadow-sm`}>
                {msg.sender_id !== currentUser.id && (
                  <p className="text-xs mb-1 font-black uppercase tracking-widest italic">
                    <span className="text-brand-secondary">{msg.senderName}</span>
                    <span className="text-brand-muted ml-1 opacity-50">#{msg.senderTag || '0000'}</span>
                  </p>
                )}

                {msg.type === 'file' && msg.fileData && (
                  <div className="bg-brand-bg/50 rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📎</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{msg.fileData.name}</p>
                        <p className="text-xs text-slate-400">{(msg.fileData.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <a
                        href={msg.fileData.data}
                        download={msg.fileData.name}
                        className="p-2 bg-brand-text hover:bg-white rounded-lg transition-all text-sm text-brand-bg"
                      >
                        ⬇️
                      </a>
                    </div>
                  </div>
                )}

                {msg.type === 'gif' && msg.fileData && (
                  <img src={msg.fileData.url} alt={msg.fileData.name} className="rounded-lg max-w-full mb-2" />
                )}

                {msg.type === 'sticker' && (
                  <div className="text-6xl">{msg.text}</div>
                )}

                {msg.type === 'voice' ? (
                  <AudioMessage url={msg.fileData?.url} isMe={msg.sender_id === currentUser.id} />
                ) : (msg.type === 'text' || msg.type === 'file') ? (
                  <MessageContent text={msg.text} />
                ) : null}

                <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${msg.sender_id === currentUser.id ? 'text-brand-bg/60' : 'text-brand-text-dim/50'}`}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </p>
              </div>
            </div>
          ))
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && (
        <div className="mx-4 mb-2 p-3 bg-brand-surface rounded-xl border border-brand-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-brand-text-dim">Emojis</p>
            <button onClick={() => setShowEmojiPicker(false)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {emojis.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleEmojiClick(emoji)}
                className="text-2xl hover:bg-brand-muted rounded-lg p-1 transition-all"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {showGifPicker && (
        <div className="mx-4 mb-2 p-3 bg-brand-surface rounded-xl border border-brand-border shadow-lg max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-400">GIFs</p>
            <button onClick={() => setShowGifPicker(false)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => handleGifClick(gif)}
                className="rounded-lg overflow-hidden hover:ring-2 ring-brand-primary transition-all"
              >
                <img src={gif.url} alt={gif.name} className="w-full h-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {showStickerPicker && (
        <div className="mx-4 mb-2 p-3 bg-brand-surface rounded-xl border border-brand-border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-400">Stickers</p>
            <button onClick={() => setShowStickerPicker(false)} className="text-slate-500 hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {stickers.map((sticker, idx) => (
              <button
                key={idx}
                onClick={() => handleStickerClick(sticker)}
                className="text-3xl hover:bg-brand-muted/20 rounded-lg p-2 transition-all"
              >
                {sticker}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-2 sm:p-3 border-t border-brand-border bg-brand-surface/30 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center bg-brand-bg/80 backdrop-blur-md rounded-[32px] border-2 border-brand-border p-1.5 shadow-premium transition-all focus-within:border-brand-primary/40 focus-within:ring-4 focus-within:ring-brand-primary/5">
            {/* Left Actions - Integrated Inside Bubble */}
            <div className="flex items-center gap-0.5 ml-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 flex items-center justify-center rounded-full text-brand-text-dim hover:bg-brand-muted/20 hover:text-brand-primary transition-all active:scale-90"
                title="Attach File"
              >
                <Paperclip size={20} className="rotate-45" />
              </button>

              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                  setShowStickerPicker(false);
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${showEmojiPicker ? 'bg-brand-primary/10 text-brand-primary' : 'text-brand-text-dim hover:bg-brand-muted/20 hover:text-brand-text'}`}
                title="Emojis"
              >
                <Smile size={22} strokeWidth={2.5} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />

            {/* Central Input Area */}
            <div className="flex-1 px-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? 'Recording...' : 'Type a message...'}
                className="w-full py-2.5 bg-transparent focus:outline-none text-[15px] sm:text-base text-brand-text placeholder:text-brand-text-dim/40 font-medium"
                disabled={isRecording}
              />
            </div>

            {/* Right Action - Dynamic Mic/Send Button */}
            <div className="flex items-center gap-1 mr-1">
              {/* Secondary Actions (GIF/Sticker) Hidden behind a single menu or minimized */}
              <button
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-[10px] font-black uppercase transition-all ${showGifPicker ? 'text-brand-secondary bg-brand-secondary/10' : 'text-brand-text-dim/40 hover:text-brand-text hover:bg-brand-muted/10'}`}
                title="GIFs"
              >
                GIF
              </button>

              <div className="w-px h-6 bg-brand-border/40 mx-1 hidden sm:block"></div>

              {message.trim() || isRecording ? (
                <button
                  onClick={handleSend}
                  className="w-10 h-10 bg-brand-primary text-brand-bg rounded-full flex items-center justify-center shadow-accent transition-all animate-in zoom-in-75 duration-200 active:scale-90"
                  title="Send Message"
                >
                  <Send size={18} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={handleVoiceRecord}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${isRecording ? 'bg-brand-danger text-white animate-pulse' : 'text-brand-text-dim hover:bg-brand-muted/20 hover:text-brand-primary'}`}
                  title="Voice Message"
                >
                  <Mic size={20} />
                </button>
              )}
            </div>
          </div>

          {isRecording && (
            <div className="mt-2.5 px-6 flex items-center gap-2 text-[10px] font-black text-brand-danger uppercase tracking-[0.2em] animate-pulse">
              <div className="w-1.5 h-1.5 bg-brand-danger rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
              Voice recording active...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatTab;
