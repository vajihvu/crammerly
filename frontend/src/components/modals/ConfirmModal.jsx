// src/components/modals/ConfirmModal.jsx
import React from 'react';
import { AlertCircle, X, Check } from 'lucide-react';

function ConfirmModal({ config, onClose }) {
    if (!config) return null;

    const { title, message, onConfirm, type = 'danger', confirmText = 'Confirm', cancelText = 'Cancel' } = config;

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface rounded-[40px] w-full max-w-[400px] border border-brand-border/30 shadow-2xl p-8 animate-in zoom-in-95 duration-500 relative overflow-hidden font-sans text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"></div>

                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-lg border-2 ${type === 'danger' ? 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger' : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                    }`}>
                    <AlertCircle size={40} />
                </div>

                <h3 className="text-2xl font-[1000] text-brand-text uppercase tracking-tighter mb-3">{title}</h3>
                <p className="text-brand-text-dim text-sm font-medium mb-10 leading-relaxed px-4">{message}</p>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-brand-muted/10 hover:bg-brand-muted/20 text-brand-text-dim font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all font-sans"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`flex-1 py-4 rounded-2xl font-[1000] text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 font-sans ring-4 ring-brand-bg ${type === 'danger' ? 'bg-brand-danger text-white hover:bg-red-700' : 'bg-brand-primary text-brand-bg hover:bg-brand-secondary'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
