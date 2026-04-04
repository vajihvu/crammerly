// src/components/tabs/AITutorTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, MessageCircle, Loader } from 'lucide-react';

function AITutorTab({ room }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`crammer_ai_chat_${room?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (room?.id) {
      localStorage.setItem(`crammer_ai_chat_${room.id}`, JSON.stringify(messages));
    }
  }, [messages, room?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!apiKey || apiKey === "YOUR_DEEPSEEK_API_KEY") {
        // Demo mode fallback
        setTimeout(() => {
          const roomTopic = room?.topic || 'this subject';
          const demoResponses = [
            `That's a great question about ${roomTopic}! In this context, it's important to remember the core principles we've discussed.`,
            `I'm currently in demo mode (API key not set), but I can tell you that ${roomTopic} is a fascinating subject with many real-world applications.`,
            `Could you tell me more about what specific part of ${roomTopic} you're finding challenging?`
          ];
          const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: `You are an AI tutor helping students with ${room?.topic || 'their subject'}. Be encouraging, clear, and educational. Provide hints rather than full solutions.` },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: "user", content: input }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.choices[0].message.content || "Sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("DeepSeek Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'I encountered an issue. Please try again later.'}` }]);
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
            <div className="text-left max-w-md mx-auto space-y-2">
              <p className="text-sm text-brand-text-dim/70">Example questions:</p>
              <div className="bg-brand-bg rounded-lg p-3 text-sm border border-brand-border/30 text-brand-text">"Can you explain {room?.topic || 'this course'}?"</div>
              <div className="bg-brand-bg rounded-lg p-3 text-sm border border-brand-border/30 text-brand-text">"Give me a practice problem"</div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-brand-primary text-white shadow-lg' : 'bg-brand-bg border border-brand-border text-brand-text'} rounded-2xl p-4 shadow-md`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={16} className="text-brand-primary" />
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">AI Tutor</span>
                  </div>
                )}
                <p className={`whitespace-pre-wrap leading-relaxed ${msg.role === 'user' ? 'text-white font-medium' : 'text-brand-text'}`}>{msg.content}</p>
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
              className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 shrink-0 ${isLoading ? 'bg-brand-muted opacity-50' : 'bg-brand-text hover:bg-brand-text/90'}`}
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
