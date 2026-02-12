// src/components/modals/JoinByCodeModal.jsx
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

function JoinByCodeModal({ onClose, onJoin }) {
  const [code, setCode] = useState('');

  const handleJoin = () => {
    if (code.trim().length === 6) {
      onJoin(code.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg/90 backdrop-blur-2xl flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="bg-brand-surface rounded-[32px] w-full max-w-[320px] border border-brand-border/50 shadow-2xl p-6 py-8 animate-in zoom-in-95 duration-500 relative overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-5">
          <h3 className="text-lg font-black text-brand-text uppercase tracking-tighter font-sans">Enter room code</h3>
        </div>
        <div className="space-y-10 relative z-10">
          <div className="relative group">
            <input
              type="text"
              placeholder="_ _ _ _ _ _"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s/g, '').toUpperCase())}
              maxLength={6}
              className="w-full bg-brand-bg border-[3px] border-brand-primary/30 rounded-[20px] px-4 py-5 text-center text-2xl font-black tracking-[0.25em] text-brand-text/40 focus:text-brand-text focus:border-brand-primary focus:outline-none shadow-premium transition-all uppercase placeholder:text-brand-text/10 font-sans"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between mt-6 px-1 gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2.5 text-brand-text font-[950] text-[9px] uppercase tracking-[0.25em] hover:opacity-50 transition-all text-center font-sans"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={code.length !== 6}
              className={`flex-[1.5] px-4 py-3 rounded-[16px] font-[950] text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-brand-border/10 font-sans ${code.length === 6
                ? 'bg-brand-text text-brand-bg shadow-[0_8px_16px_rgba(0,0,0,0.1)]'
                : 'bg-brand-muted/20 text-brand-text/30 cursor-not-allowed'
                }`}
            >
              Join
              <ArrowRight size={14} className={code.length === 6 ? 'text-brand-bg/70' : 'text-brand-text/30'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinByCodeModal;
