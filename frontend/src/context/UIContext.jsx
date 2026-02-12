import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { apiEvents } from '../api/client';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [globalLoading, setGlobalLoading] = useState(false);

    const addToast = useCallback((message, type = 'info', duration = 5000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration !== Infinity) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
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

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {/* Global Loading Overlay */}
            {globalLoading && (
                <div className="fixed inset-0 z-[10000] bg-white/60 dark:bg-black/40 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-zinc-100 dark:border-zinc-800 scale-in-center">
                        <Loader2 className="w-10 h-10 animate-spin text-zinc-900 dark:text-white" />
                        <p className="text-sm font-bold tracking-tight text-zinc-500 dark:text-zinc-400">Loading...</p>
                    </div>
                </div>
            )}
        </UIContext.Provider>
    );
};

const Toast = ({ message, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-rose-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
    };

    const colors = {
        success: 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20',
        error: 'border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20',
        info: 'border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20',
        warning: 'border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20',
    };

    return (
        <div className={`pointer-events-auto flex items-center gap-4 p-4 rounded-2xl border shadow-xl backdrop-blur-md animate-in slide-in-from-right-8 duration-300 font-inter ${colors[type] || colors.info}`}>
            <div className="shrink-0">{icons[type] || icons.info}</div>
            <div className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{message}</div>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
                <X className="w-4 h-4 text-zinc-400" />
            </button>
        </div>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};
