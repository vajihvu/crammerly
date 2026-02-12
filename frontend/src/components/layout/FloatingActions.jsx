import React from 'react';
import { TrendingUp, NotebookPen, CheckCircle, Bot, X } from 'lucide-react';

const FloatingActions = ({
    view,
    modals,
    setFloatingPanel
}) => {
    if (view !== 'home') return null;

    return (
        <>
            <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 flex flex-col gap-3 sm:gap-4 z-40" onClick={(e) => e.stopPropagation()}>

                {modals.floating !== 'notebook' && (
                    <button
                        onClick={() => setFloatingPanel('notebook')}
                        className="w-12 h-12 sm:w-14 sm:h-14 !bg-brand-surface hover:bg-brand-card rounded-full flex items-center justify-center transition-all hover:scale-110 border border-brand-border hover:border-brand-primary group shadow-2xl"
                        title="Notebook"
                    >
                        <NotebookPen size={20} className="sm:w-6 sm:h-6 text-brand-text-dim group-hover:text-brand-text transition-colors" />
                    </button>
                )}

                {modals.floating !== 'todo' && (
                    <button
                        onClick={() => setFloatingPanel('todo')}
                        className="w-12 h-12 sm:w-14 sm:h-14 !bg-brand-surface hover:bg-brand-card rounded-full flex items-center justify-center transition-all hover:scale-110 border border-brand-border hover:border-brand-primary group shadow-2xl"
                        title="To-Do List"
                    >
                        <CheckCircle size={20} className="sm:w-6 sm:h-6 text-brand-text-dim group-hover:text-brand-text transition-colors" />
                    </button>
                )}

                {modals.floating !== 'chatbot' && (
                    <button
                        onClick={() => setFloatingPanel('chatbot')}
                        className="w-12 h-12 sm:w-14 sm:h-14 !bg-brand-surface hover:bg-brand-card rounded-full flex items-center justify-center transition-all hover:scale-110 border border-brand-border hover:border-brand-primary group shadow-2xl"
                        title="AI Assistant"
                    >
                        <Bot size={20} className="sm:w-6 sm:h-6 text-brand-text-dim group-hover:text-brand-text transition-colors" />
                    </button>
                )}
            </div>

        </>
    );
};

export default FloatingActions;
