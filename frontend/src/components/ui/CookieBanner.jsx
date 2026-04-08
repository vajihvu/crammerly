import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            // Slight delay for premium feel
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[9999] w-auto max-w-2xl animate-fade-in-up">
            <div className="bg-brand-bg/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-brand-border/30 rounded-[28px] p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Cookie className="text-brand-primary w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-base sm:text-lg font-[900] text-brand-text tracking-tight mb-0.5 sm:mb-1 uppercase">
                        Study Session Cookies
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-brand-text-dim leading-relaxed max-w-md">
                        Crammerly uses essential cookies to keep you logged in and ensure secure P2P video calls.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <a 
                        href="/privacy" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-text hover:bg-brand-text/5 transition-all text-center"
                    >
                        Privacy
                    </a>
                    <button
                        onClick={handleAccept}
                        className="flex-1 sm:flex-none px-8 py-3 bg-brand-primary text-brand-bg rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-accent hover:scale-105 active:scale-95 transition-all"
                    >
                        Got it
                    </button>
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="hidden sm:block p-2 text-brand-muted hover:text-brand-text transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;
