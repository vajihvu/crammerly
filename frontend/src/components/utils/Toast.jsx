import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X, Bell } from 'lucide-react';

const Toast = ({ message, type = 'info', id, onRemove }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = useCallback(() => {
        setIsVisible(false);
        setTimeout(() => onRemove(id), 300); // Wait for exit animation
    }, [id, onRemove]);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [handleClose]);

    const icons = {
        success: <CheckCircle className="text-brand-success" size={20} />,
        danger: <AlertCircle className="text-brand-danger" size={20} />,
        info: <Info className="text-brand-primary" size={20} />,
        warning: <Bell className="text-brand-warning" size={20} />,
    };

    const borders = {
        success: 'border-brand-success/30',
        danger: 'border-brand-danger/30',
        info: 'border-brand-primary/30',
        warning: 'border-brand-warning/30',
    };

    return (
        <div
            className={`flex items-center gap-4 px-5 py-4 bg-brand-surface border ${borders[type]} rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] min-w-[320px] max-w-md transition-all duration-300 pointer-events-auto transform
      ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[200px] opacity-0 scale-90'}`}
        >
            <div className="shrink-0">{icons[type]}</div>
            <div className="flex-1">
                <p className="text-brand-text font-black uppercase text-[10px] tracking-widest mb-0.5">{type}</p>
                <p className="text-brand-text/80 text-xs font-bold leading-tight">{message}</p>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-brand-bg rounded-lg transition-all text-brand-text-dim hover:text-brand-text">
                <X size={16} />
            </button>
        </div>
    );
};

export const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[100000] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onRemove={removeToast} />
            ))}
        </div>
    );
};
