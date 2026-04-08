import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { apiEvents } from '../api/client';
import { ToastContainer } from '../components/utils/Toast';
import CookieBanner from '../components/ui/CookieBanner';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [globalLoading, setGlobalLoading] = useState(false);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const setLoading = useCallback((loading) => {
        setGlobalLoading(loading);
    }, []);

    useEffect(() => {
        const handleError = (e) => {
            const { message, code } = e.detail;
            addToast(`${message}${code ? ` (${code})` : ''}`, 'error');
        };

        const handleLoading = (e) => {
            setGlobalLoading(e.detail);
        };

        window.addEventListener(apiEvents.ERROR, handleError);
        window.addEventListener(apiEvents.LOADING, handleLoading);

        return () => {
            window.removeEventListener(apiEvents.ERROR, handleError);
            window.removeEventListener(apiEvents.LOADING, handleLoading);
        };
    }, [addToast]);

    const value = useMemo(() => ({
        toasts,
        addToast,
        removeToast,
        loading: globalLoading,
        setLoading
    }), [toasts, addToast, removeToast, globalLoading, setLoading]);

    return (
        <UIContext.Provider value={value}>
            {children}



            {/* Global Loading Overlay */}
            {globalLoading && (
                <div className="fixed inset-0 z-[10000] bg-white/60 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-zinc-100 dark:border-zinc-800 scale-in-center">
                        <Loader2 className="w-10 h-10 animate-spin text-zinc-900 dark:text-white" />
                        <p className="text-sm font-bold tracking-tight text-zinc-500 dark:text-zinc-400">Loading...</p>
                    </div>
                </div>
            )}
            {/* Global Toasts */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <CookieBanner />
        </UIContext.Provider>
    );
};



// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};
