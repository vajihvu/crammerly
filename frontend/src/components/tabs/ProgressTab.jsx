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
    <div className="flex-1 flex flex-col gap-6 min-h-[500px]">
      <div className="bg-brand-card rounded-2xl p-6 border border-brand-border shadow-xl">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-text">
          <CheckCircle className="text-brand-primary" />
          Track Your Progress
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="What did you complete?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-3 bg-brand-bg rounded-xl border border-brand-border focus:outline-none focus:ring-1 focus:ring-brand-primary text-brand-text text-sm sm:text-base"
          />
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-brand-text hover:bg-black text-brand-bg rounded-xl font-black transition-all shadow-lg active:scale-95 text-sm sm:text-base"
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="bg-brand-card rounded-2xl p-6 border border-brand-border shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-brand-text">Your Completed Tasks</h3>
        {currentMember && (currentMember.progress || []).length > 0 ? (
          <div className="space-y-2">
            {(currentMember.progress || []).map((p, idx) => (
              <div key={idx} className="bg-brand-bg/50 rounded-xl p-4 border border-brand-border/30">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-brand-primary/60 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="font-medium text-brand-text">{p.task}</p>
                    <p className="text-xs text-brand-text-dim mt-1">{new Date(p.time).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brand-text-dim/50 text-center py-8">No progress tracked yet. Add your first task!</p>
        )}
      </div>

      <div className="bg-brand-card rounded-2xl p-6 border border-brand-border shadow-xl">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-brand-text">
          <Bell className="text-brand-primary" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {(room.members || [])
            .flatMap(member => (member.progress || []).map(p => ({ ...p, memberName: member.name || 'Anonymous' })))
            .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
            .slice(0, 10)
            .map((activity, idx) => (
              <div key={idx} className="bg-brand-bg/50 rounded-lg p-3 border-l-4 border-brand-primary">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-brand-muted rounded-full flex items-center justify-center text-[10px] font-black text-brand-text">
                    {(activity.memberName || '?')[0].toUpperCase()}
                  </div>
                  <p className="font-bold text-sm text-brand-text">{activity.memberName}</p>
                </div>
                <p className="text-sm text-brand-text-dim">{activity.task}</p>
                <p className="text-xs text-brand-text-dim/50 mt-1">{activity.time ? new Date(activity.time).toLocaleString() : 'Recent'}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default ProgressTab;