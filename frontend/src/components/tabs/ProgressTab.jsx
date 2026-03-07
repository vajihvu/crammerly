// src/components/tabs/ProgressTab.jsx
import React, { useState } from 'react';
import { CheckCircle, Bell } from 'lucide-react';

function ProgressTab({ room, currentMember, onMarkProgress }) {
  const [newTask, setNewTask] = useState('');

  const handleAdd = () => {
    if (!newTask.trim()) return;
    onMarkProgress(newTask);
    setNewTask('');
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0 h-full overflow-y-auto custom-scrollbar">
      <div className="bg-brand-card rounded-2xl p-4 border border-brand-border shadow-xl shrink-0">
        <h3 className="text-base font-bold mb-2 flex items-center gap-2 text-brand-text">
          <CheckCircle className="text-brand-primary" size={18} />
          Track Your Progress
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="What did you complete?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-3 py-2 bg-brand-bg rounded-xl border border-brand-border focus:outline-none focus:ring-1 focus:ring-brand-primary text-brand-text text-sm"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-brand-text hover:bg-black text-brand-bg rounded-xl font-black transition-all shadow-lg active:scale-95 text-sm"
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="bg-brand-card rounded-2xl p-4 border border-brand-border shadow-xl shrink-0">
        <h3 className="text-sm font-bold mb-2 text-brand-text">Your Completed Tasks</h3>
        {currentMember && (currentMember.progress || []).length > 0 ? (
          <div className="space-y-1.5">
            {(currentMember.progress || []).map((p, idx) => (
              <div key={idx} className="bg-brand-bg/50 rounded-xl p-3 border border-brand-border/30">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-brand-primary/60 mt-0.5" size={16} />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-brand-text">{p.task}</p>
                    <p className="text-[10px] text-brand-text-dim mt-0.5">{new Date(p.time).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-text-dim/50 text-center py-4 text-sm">No progress tracked yet. Add your first task!</p>
        )}
      </div>

      <div className="bg-brand-card rounded-2xl p-4 border border-brand-border shadow-xl shrink-0">
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-brand-text">
          <Bell className="text-brand-primary" size={16} />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {(room.members || [])
            .flatMap(member => (member.progress || []).map(p => ({ ...p, memberName: member.name || 'Anonymous' })))
            .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
            .slice(0, 10)
            .map((activity, idx) => (
              <div key={idx} className="bg-brand-bg/50 rounded-lg p-2.5 border-l-4 border-brand-primary">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-5 h-5 bg-brand-muted rounded-full flex items-center justify-center text-[9px] font-black text-brand-text">
                    {(activity.memberName || '?')[0].toUpperCase()}
                  </div>
                  <p className="font-bold text-xs text-brand-text">{activity.memberName}</p>
                </div>
                <p className="text-xs text-brand-text-dim">{activity.task}</p>
                <p className="text-[10px] text-brand-text-dim/50 mt-0.5">{activity.time ? new Date(activity.time).toLocaleString() : 'Recent'}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ProgressTab;
