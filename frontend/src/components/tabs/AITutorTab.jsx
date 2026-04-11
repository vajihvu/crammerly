// src/components/tabs/AITutorTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, MessageCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { aiApi } from '../../api';

function AITutorTab({ room }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Derive user ID safely
  const userId = user?.id || user?._id || user?.user?.id || user?.user?._id;

  // Load messages on mount or when user/room changes
  useEffect(() => {
    if (userId && room?.id) {
      try {
        const key = `crammer_ai_chat_${userId}_${room.id}`;
        const saved = localStorage.getItem(key);
        setMessages(saved ? JSON.parse(saved) : []);
      } catch (err) {
        console.error("Failed to load AI chat history:", err);
        setMessages([]);
      }
    }
  }, [userId, room?.id]);

  // Persist messages when they change
  useEffect(() => {
    if (userId && room?.id && messages.length > 0) {
      const key = `crammer_ai_chat_${userId}_${room.id}`;
      localStorage.setItem(key, JSON.stringify(messages));
    }
  }, [messages, userId, room?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideInput = null) => {
    const query = typeof overrideInput === 'string' ? overrideInput : input;
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    if (typeof overrideInput !== 'string') {
        setInput('');
    }
    setIsLoading(true);

    try {
      // Use the secure backend proxy instead of direct deepseek calls
      const res = await aiApi.chat(query, messages.map(msg => ({
          role: msg.role,
          content: msg.content
      })));

      if (res && res.choices && res.choices[0]) {
          const aiText = res.choices[0].message.content || "Sorry, I couldn't generate a response.";
          setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
      } else {
          throw new Error("Invalid response format from AI service");
      }
    } catch (error) {
      console.error("AI Tutor Error:", error);
      const errorMessage = 
        error.response?.data?.error?.message || 
        error.response?.data?.message || 
        error.message || 
        'I encountered an issue. Please try again later.';
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-card rounded-2xl border border-brand-border flex flex-col flex-1 min-h-0 h-full overflow-hidden shadow-xl">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-text-dim">
            <Bot size={40} className="mx-auto mb-3 text-brand-primary/50 opacity-50" />
            <h3 className="text-lg font-bold mb-1 text-brand-text">AI Study Assistant</h3>
            <p className="mb-4">Ask me anything about {room?.topic || 'this subject'}!</p>
            <div className="text-left w-full max-w-md mx-auto space-y-2 px-4">
              <p className="text-sm text-brand-text-dim/70">Example questions:</p>
              <button 
                onClick={() => handleSend(`Can you explain ${room?.topic || 'this course'}?`)}
                className="w-full bg-brand-bg hover:bg-brand-muted/20 rounded-xl p-3 text-sm border border-brand-border/30 text-brand-text transition-all active:scale-95 text-left flex items-center justify-between group shadow-sm"
              >
                  <span className="truncate pr-2">"Can you explain {room?.topic || 'this course'}?"</span>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Send size={12} className="text-brand-primary ml-0.5" />
                  </div>
              </button>
              <button 
                onClick={() => handleSend(`Give me a practice problem about ${room?.topic || 'this course'}`)}
                className="w-full bg-brand-bg hover:bg-brand-muted/20 rounded-xl p-3 text-sm border border-brand-border/30 text-brand-text transition-all active:scale-95 text-left flex items-center justify-between group shadow-sm"
              >
                  <span className="truncate pr-2">"Give me a practice problem about {room?.topic || 'this course'}"</span>
                  <div className="shrink-0 w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Send size={12} className="text-brand-primary ml-0.5" />
                  </div>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-brand-primary text-brand-bg shadow-lg' : 'bg-brand-bg border border-brand-border text-brand-text'} rounded-2xl p-4 shadow-md`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={16} className="text-brand-primary" />
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">AI Tutor</span>
                  </div>
                )}
                <p className={`whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'text-brand-bg font-medium' : 'text-brand-text'}`}>{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 flex items-center gap-2">
              <Loader className="animate-spin text-brand-primary" size={20} />
              <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Processing</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 sm:p-3 border-t border-brand-border/50 bg-brand-surface/30 shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center bg-brand-bg/80 backdrop-blur-md rounded-[32px] border-2 border-brand-border p-1.5 shadow-premium transition-all focus-within:border-brand-primary/40 focus-within:ring-4 focus-within:ring-brand-primary/5">
            <div className="flex-1 px-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask the AI tutor..."
                className="w-full py-2.5 bg-transparent focus:outline-none text-[15px] sm:text-base text-brand-text placeholder:text-brand-text-dim/40 font-medium"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 shrink-0 ${isLoading ? 'bg-brand-muted opacity-50' : 'bg-brand-primary text-brand-bg hover:bg-brand-primary/90'}`}
              title="Send Message"
            >
              {isLoading ? (
                <Loader size={18} className="animate-spin text-brand-bg" />
              ) : (
                <Send size={18} fill="currentColor" className="text-brand-bg ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AITutorTab;
