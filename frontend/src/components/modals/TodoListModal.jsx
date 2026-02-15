// src/components/modals/TodoListModal.jsx
import React, { useState } from 'react';
import { X, CheckCircle, Plus, Trash2, ListChecks, Target, Sparkles, Check } from 'lucide-react';

function TodoListModal({ todos = [], onClose, onAddTodo, onToggleTodo, onDeleteTodo }) {
  const [newTodo, setNewTodo] = useState('');

  const handleAdd = () => {
    if (newTodo.trim() && onAddTodo) {
      onAddTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  const safeTodos = Array.isArray(todos) ? todos : [];
  const incompleteTodos = safeTodos.filter(t => t && !t.completed);
  const completedTodos = safeTodos.filter(t => t && t.completed);

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-end justify-center sm:justify-end p-0 sm:p-6 pointer-events-none" onClick={onClose}>
      <div className="w-full sm:w-[360px] sm:mr-20 sm:mb-4 h-[100dvh] sm:h-auto sm:max-h-[calc(100vh-120px)] bg-brand-surface rounded-none sm:rounded-[32px] border-0 sm:border border-brand-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto z-[9999] font-sans" onClick={(e) => e.stopPropagation()}>

        {/* Dynamic Header */}
        <div className="relative p-6 border-b border-white/5 bg-brand-bg/50">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-brand-muted/20 rounded-xl flex items-center justify-center shadow-lg rotate-[-2deg] border border-brand-border">
                <ListChecks className="text-brand-primary" size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-brand-text tracking-tighter leading-none font-sans uppercase">TO-DO LIST</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/10 rounded-full transition-all active:scale-90">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modern Input Section */}
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 bg-brand-bg p-1.5 rounded-2xl border border-brand-border group focus-within:border-brand-primary transition-all duration-300 shadow-inner">
            <div className="flex-1 px-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Add New Task."
                className="w-full bg-transparent border-none text-sm font-black text-brand-text placeholder:text-brand-muted/50 focus:outline-none py-1 font-sans"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-10 h-10 bg-brand-primary hover:bg-brand-surface text-white hover:text-brand-primary rounded-[14px] flex items-center justify-center transition-all shadow-lg active:scale-90"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar space-y-8">
          {incompleteTodos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Target size={14} className="text-brand-success" />
                <h4 className="text-[10px] font-black text-brand-text-dim uppercase tracking-[0.2em] font-sans">Priorities</h4>
              </div>
              <div className="space-y-3">
                {incompleteTodos.map((todo) => (
                  <div key={todo.id} className="group flex items-center gap-3 bg-brand-card hover:bg-brand-surface p-4 rounded-[22px] border border-brand-border hover:border-brand-primary transition-all duration-300">
                    <button
                      onClick={() => onToggleTodo(todo.id)}
                      className="w-6 h-6 rounded-full border-2 border-brand-border flex items-center justify-center hover:border-brand-primary hover:bg-brand-primary/10 transition-all group-hover:scale-110 active:scale-90"
                    >
                      {/* Empty for incomplete */}
                    </button>
                    <span className="text-sm font-black text-brand-text flex-1 leading-tight font-sans">{todo.text}</span>
                    <button
                      onClick={() => onDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-brand-danger/20 rounded-full transition-all"
                    >
                      <Trash2 size={14} className="text-brand-danger" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedTodos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkles size={14} className="text-brand-secondary" />
                <h4 className="text-[10px] font-black text-brand-text-dim uppercase tracking-[0.2em] font-sans">Accomplished</h4>
              </div>
              <div className="space-y-3">
                {completedTodos.map((todo) => (
                  <div key={todo.id} className="group flex items-center gap-3 bg-brand-bg/50 p-4 rounded-[22px] border border-brand-border/30 transition-all">
                    <button
                      onClick={() => onToggleTodo(todo.id)}
                      className="w-6 h-6 rounded-full bg-brand-success flex items-center justify-center shadow-lg"
                    >
                      <Check size={14} className="text-brand-bg" strokeWidth={4} />
                    </button>
                    <span className="text-sm font-medium text-brand-text-dim line-through flex-1 leading-tight font-sans">{todo.text}</span>
                    <button
                      onClick={() => onDeleteTodo(todo.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-brand-danger/20 rounded-full transition-all"
                    >
                      <Trash2 size={14} className="text-brand-danger" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {safeTodos.length === 0 && (
            <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-brand-card rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-brand-border rotate-3 shadow-xl">
                <CheckCircle size={32} className="text-brand-muted" />
              </div>
              <p className="text-[12px] font-black text-brand-muted uppercase tracking-[0.25em] font-sans">Inbox Zero</p>
              <p className="text-[11px] font-medium text-brand-text-dim mt-2 font-sans">Your study mission begins here.</p>
            </div>
          )}
        </div>

        {/* Completion Indicator Footer */}
        <div className="px-8 py-3 bg-brand-bg/50 flex items-center justify-between border-t border-brand-border">
          <div className="flex gap-1">
            {safeTodos.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i < completedTodos.length ? 'w-4 bg-brand-success shadow-[0_0_8px_#798777]' : 'w-2 bg-brand-muted/30'}`}></div>
            ))}
          </div>
          <span className="text-[11px] font-black text-brand-text-dim uppercase tracking-widest leading-none font-sans">
            {safeTodos.length > 0 ? `${Math.round((completedTodos.length / safeTodos.length) * 100)}% Complete` : 'Mission Idle'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TodoListModal;
