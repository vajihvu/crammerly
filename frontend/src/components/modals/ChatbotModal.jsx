// src/components/modals/ChatbotModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Loader, Sparkles, BrainCircuit, User, Paperclip, FileCheck } from 'lucide-react';

function ChatbotModal({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userInfo?.token}`
        },
        body: JSON.stringify({
          message: input,
          context: messages.map(msg => ({ role: msg.role, content: msg.content }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Security guard blocked the request');
      }

      const aiText = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `System Guard: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }

  };


  const handleFileShare = (e) => {
    const file = e.target.files[0];
    if (file) {
      const userMessage = {
        role: 'user',
        content: `Refining vault with uploaded file: ${file.name}`,
        type: 'file',
        fileName: file.name
      };
      setMessages([...messages, userMessage]);
      setIsLoading(true);

      // Simulate AI processing the file
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Connection established with "${file.name}". I've parsed the document structure. How would you like me to analyze this data? I can summarize it, extract key formulas, or prepare a practice quiz.`
        }]);
        setIsLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-end justify-center sm:justify-end p-0 sm:p-6">
      {/* Backdrop for mobile or just to catch clicks - only active on mobile usually or if we want full modal behavior */}
      <div className="absolute inset-0 bg-black/5 sm:bg-transparent" onClick={onClose}></div>

      <div className="w-full sm:w-[450px] sm:mr-20 sm:mb-4 h-[100dvh] sm:h-auto sm:max-h-[calc(100vh-120px)] bg-brand-surface rounded-none sm:rounded-[32px] border-0 sm:border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 relative z-10 font-sans" onClick={(e) => e.stopPropagation()}>

        {/* Galactic AI Header */}
        <div className="relative p-6 pt-7 border-b border-brand-border/30 bg-brand-bg/80">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center shadow-lg relative group border border-brand-primary/30">
                <Bot className="text-brand-primary group-hover:scale-110 transition-transform" size={24} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-brand-success border-4 border-brand-surface rounded-full shadow-[0_0_10px_#798777]"></div>
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-text tracking-tight leading-none uppercase">Crammer<span className="text-brand-primary">ly</span> <span className="text-brand-secondary">Chatbot</span></h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 text-brand-text-dim hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* AI Chat Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-brand-bg relative">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <BrainCircuit size={64} className="text-brand-primary/40 relative z-10" />
              </div>
              <div className="space-y-2">
                <p className="text-[14px] font-black text-brand-text tracking-tight">I'm here to help you study!</p>
                <p className="text-[12px] font-medium text-brand-text-dim max-w-[220px] mx-auto">Ask me a question or share your notes to get started.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] relative ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`
                  px-4 py-3.5 rounded-[22px] text-[13px] leading-relaxed relative shadow-lg
                  ${msg.role === 'user'
                      ? 'bg-gradient-to-br from-brand-secondary to-brand-primary text-brand-bg rounded-tr-none font-black'
                      : 'bg-brand-surface border border-brand-border text-brand-text rounded-tl-none backdrop-blur-sm'
                    }
                `}>
                    {msg.type === 'file' && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-brand-bg/20 rounded-xl border border-white/20">
                        <FileCheck size={18} />
                        <span className="truncate max-w-[150px]">{msg.fileName}</span>
                      </div>
                    )}
                    {msg.content}
                  </div>
                  <div className={`text-[9px] font-black text-brand-text-dim uppercase tracking-widest mt-2 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.role === 'user' ? 'Sent' : 'Crammerly Response'}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start items-center gap-3">
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex gap-1.5 shadow-xl">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-brand-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-brand-tertiary rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Galactic Input Zone */}
        <div className="p-6 bg-brand-surface border-t border-brand-border">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileShare}
            className="hidden"
          />
          <div className="flex gap-2 items-center bg-brand-bg p-2 rounded-[24px] border border-brand-border focus-within:border-brand-primary transition-all duration-300 shadow-inner">
            <button
              onClick={() => fileInputRef.current.click()}
              className="p-2 text-brand-primary hover:text-brand-text transition-colors rotate-45"
            >
              <Paperclip size={20} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Enter message into chat..."
              className="flex-1 px-2 py-2 bg-transparent border-none text-[13px] font-bold text-brand-text placeholder:text-brand-muted focus:outline-none relative z-50"
              disabled={isLoading}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="w-11 h-11 bg-brand-primary hover:bg-black text-white rounded-[18px] flex items-center justify-center transition-all shadow-lg active:scale-95 disabled:opacity-30 group"
            >
              <Send size={18} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotModal;