// src/components/tabs/BoardTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, GripVertical, Clock, User, Tag, Trash2, X, Check, Calendar, Hand, ChevronDown, AlertCircle } from 'lucide-react';
import { tasksApi } from '../../api/tasks';

const COLUMNS = [
    { key: 'todo', label: 'To Do', color: 'brand-primary', emoji: '📋' },
    { key: 'in_progress', label: 'In Progress', color: 'blue-500', emoji: '🔨' },
    { key: 'done', label: 'Done', color: 'emerald-500', emoji: '✅' }
];

const ROLE_COLORS = {
    'Editor': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    'Presenter': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Researcher': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    'Designer': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
    'Developer': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Writer': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Tester': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'Lead': 'bg-red-500/15 text-red-400 border-red-500/30',
};

function getRoleClass(role) {
    return ROLE_COLORS[role] || 'bg-brand-muted/15 text-brand-text-dim border-brand-border/30';
}

function getDueBadge(dueDate) {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) return { text: 'Overdue', cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
    if (diffHours <= 24) return { text: `${Math.ceil(diffHours)}h left`, cls: 'bg-red-500/15 text-red-400 border-red-500/30' };
    if (diffDays <= 3) return { text: `${Math.ceil(diffDays)}d left`, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    return { text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
}

// ─── Task Card Component ───
function TaskCardComponent({ task, currentUser, onUpdate, onDelete, onClaim }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDesc, setEditDesc] = useState(task.description || '');
    const [isEditing, setIsEditing] = useState(false);

    const dueBadge = getDueBadge(task.dueDate);
    const isAssignedToMe = task.assignee?._id === currentUser.id;

    const handleSaveEdit = () => {
        onUpdate(task._id, { title: editTitle, description: editDesc });
        setIsEditing(false);
    };

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task._id);
                e.dataTransfer.setData('fromStatus', task.status);
                e.currentTarget.style.opacity = '0.5';
            }}
            onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
            className="bg-brand-bg rounded-xl p-3 border border-brand-border/30 hover:border-brand-primary/40 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md"
        >
            <div className="flex items-start gap-2">
                <GripVertical size={14} className="text-brand-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="space-y-2">
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-brand-surface border border-brand-primary/30 rounded-lg px-2 py-1 text-sm font-bold text-brand-text focus:outline-none"
                                autoFocus
                            />
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                className="w-full bg-brand-surface border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text-dim focus:outline-none resize-none"
                                rows={2}
                                placeholder="Description..."
                            />
                            <div className="flex gap-1">
                                <button onClick={handleSaveEdit} className="p-1 bg-brand-primary/10 rounded text-brand-primary hover:bg-brand-primary/20 transition-all"><Check size={12} /></button>
                                <button onClick={() => { setIsEditing(false); setEditTitle(task.title); setEditDesc(task.description || ''); }} className="p-1 bg-brand-muted/10 rounded text-brand-text-dim hover:bg-brand-muted/20 transition-all"><X size={12} /></button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p
                                className="font-bold text-sm text-brand-text leading-tight cursor-pointer hover:text-brand-primary transition-colors"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {task.title}
                            </p>
                            {(isExpanded && task.description) && (
                                <p className="text-xs text-brand-text-dim mt-1.5 animate-in fade-in duration-200">{task.description}</p>
                            )}
                        </>
                    )}

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {task.role && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getRoleClass(task.role)}`}>
                                <Tag size={8} className="inline mr-0.5" />{task.role}
                            </span>
                        )}
                        {dueBadge && (
                            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${dueBadge.cls}`}>
                                <Clock size={8} className="inline mr-0.5" />{dueBadge.text}
                            </span>
                        )}
                        {task.assignee ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand-surface border border-brand-border/30 text-brand-text-dim flex items-center gap-1">
                                <User size={8} />{task.assignee.name}
                            </span>
                        ) : (
                            <button
                                onClick={() => onClaim(task._id)}
                                className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all flex items-center gap-0.5"
                            >
                                <Hand size={8} />Claim
                            </button>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {isAssignedToMe && (
                        <button
                            onClick={() => onClaim(task._id)}
                            className="p-1 rounded hover:bg-brand-muted/20 text-brand-text-dim transition-all"
                            title="Unclaim"
                        >
                            <Hand size={12} />
                        </button>
                    )}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 rounded hover:bg-brand-primary/10 text-brand-text-dim hover:text-brand-primary transition-all"
                        title="Edit"
                    >
                        <Tag size={12} />
                    </button>
                    <button
                        onClick={() => onDelete(task._id)}
                        className="p-1 rounded hover:bg-red-500/10 text-brand-text-dim hover:text-red-400 transition-all"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Add Task Inline Form ───
function AddTaskForm({ onAdd, members }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [role, setRole] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignee, setAssignee] = useState('');

    const handleSubmit = () => {
        if (!title.trim()) return;
        onAdd({
            title: title.trim(),
            description: description.trim(),
            role: role.trim(),
            dueDate: dueDate || null,
            assignee: assignee || null
        });
        setTitle(''); setDescription(''); setRole(''); setDueDate(''); setAssignee('');
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full py-2.5 border-2 border-dashed border-brand-border/40 rounded-xl text-xs font-black text-brand-text-dim uppercase tracking-widest hover:border-brand-primary/40 hover:text-brand-primary transition-all flex items-center justify-center gap-2"
            >
                <Plus size={14} />Add Task
            </button>
        );
    }

    return (
        <div className="bg-brand-bg rounded-xl p-3 border border-brand-primary/30 space-y-2 animate-in fade-in zoom-in-95 duration-200">
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm font-bold text-brand-text focus:outline-none focus:border-brand-primary/50"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description (optional)..."
                className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-text-dim focus:outline-none resize-none"
                rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
                <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Role (e.g. Editor)"
                    className="bg-brand-surface border border-brand-border rounded-lg px-2 py-1.5 text-[11px] text-brand-text focus:outline-none"
                />
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="bg-brand-surface border border-brand-border rounded-lg px-2 py-1.5 text-[11px] text-brand-text focus:outline-none"
                />
            </div>
            {members && members.length > 0 && (
                <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border rounded-lg px-2 py-1.5 text-[11px] text-brand-text focus:outline-none"
                >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            )}
            <div className="flex gap-2 pt-1">
                <button onClick={handleSubmit} className="flex-1 py-2 bg-brand-primary text-brand-bg rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-1">
                    <Plus size={12} />Create
                </button>
                <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-brand-muted/20 text-brand-text-dim rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-muted/30 transition-all">
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── Deadline Bar ───
function DeadlineBar({ tasks }) {
    const allTasks = [...(tasks.todo || []), ...(tasks.in_progress || [])];
    const withDue = allTasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (withDue.length === 0) return null;

    return (
        <div className="bg-brand-card rounded-2xl p-3 border border-brand-border shadow-sm mb-3 shrink-0">
            <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-brand-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim">Upcoming Deadlines</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {withDue.slice(0, 6).map(task => {
                    const badge = getDueBadge(task.dueDate);
                    return (
                        <div key={task._id} className="shrink-0 bg-brand-bg rounded-xl px-3 py-2 border border-brand-border/30 min-w-[140px]">
                            <p className="text-[11px] font-bold text-brand-text truncate">{task.title}</p>
                            <div className="flex items-center gap-1 mt-1">
                                {badge && <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${badge.cls}`}>{badge.text}</span>}
                                {task.assignee && <span className="text-[9px] text-brand-text-dim">{task.assignee.name}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Board Tab ───
function BoardTab({ room, currentUser, addToast }) {
    const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] });
    const [loading, setLoading] = useState(true);
    const [dragOverCol, setDragOverCol] = useState(null);

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await tasksApi.getAll(room.id);
            setTasks(data);
        } catch (err) {
            console.error('Failed to load tasks:', err);
            if (addToast) addToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    }, [room.id, addToast]);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    // Socket listeners for real-time updates
    useEffect(() => {
        const handleCreated = (e) => {
            const task = e.detail || e;
            setTasks(prev => ({
                ...prev,
                [task.status]: [...(prev[task.status] || []), task]
            }));
        };
        const handleUpdated = (e) => {
            const task = e.detail || e;
            setTasks(prev => {
                const newTasks = {};
                for (const col of ['todo', 'in_progress', 'done']) {
                    newTasks[col] = (prev[col] || []).filter(t => t._id !== task._id);
                }
                newTasks[task.status] = [...(newTasks[task.status] || []), task];
                return newTasks;
            });
        };
        const handleDeleted = (e) => {
            const { taskId } = e.detail || e;
            setTasks(prev => ({
                todo: (prev.todo || []).filter(t => t._id !== taskId),
                in_progress: (prev.in_progress || []).filter(t => t._id !== taskId),
                done: (prev.done || []).filter(t => t._id !== taskId)
            }));
        };

        window.addEventListener('task_created', handleCreated);
        window.addEventListener('task_updated', handleUpdated);
        window.addEventListener('task_deleted', handleDeleted);
        return () => {
            window.removeEventListener('task_created', handleCreated);
            window.removeEventListener('task_updated', handleUpdated);
            window.removeEventListener('task_deleted', handleDeleted);
        };
    }, []);

    const handleAddTask = async (taskData) => {
        try {
            const newTask = await tasksApi.create(room.id, taskData);
            setTasks(prev => ({
                ...prev,
                todo: [...(prev.todo || []), newTask]
            }));
            if (addToast) addToast('Task created!', 'success');
        } catch (err) {
            if (addToast) addToast(err.response?.data?.message || 'Failed to create task', 'error');
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            const updated = await tasksApi.update(room.id, taskId, updates);
            setTasks(prev => {
                const newTasks = {};
                for (const col of ['todo', 'in_progress', 'done']) {
                    newTasks[col] = (prev[col] || []).map(t => t._id === taskId ? updated : t).filter(t => t.status === col || t._id !== taskId);
                }
                // Place updated task in correct column
                const existing = [...(newTasks.todo || []), ...(newTasks.in_progress || []), ...(newTasks.done || [])].find(t => t._id === taskId);
                if (!existing) {
                    newTasks[updated.status] = [...(newTasks[updated.status] || []), updated];
                }
                return newTasks;
            });
        } catch {
            if (addToast) addToast('Failed to update task', 'error');
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await tasksApi.remove(room.id, taskId);
            setTasks(prev => ({
                todo: (prev.todo || []).filter(t => t._id !== taskId),
                in_progress: (prev.in_progress || []).filter(t => t._id !== taskId),
                done: (prev.done || []).filter(t => t._id !== taskId)
            }));
            if (addToast) addToast('Task deleted', 'success');
        } catch {
            if (addToast) addToast('Failed to delete task', 'error');
        }
    };

    const handleClaimTask = async (taskId) => {
        try {
            const updated = await tasksApi.claim(room.id, taskId);
            setTasks(prev => {
                const newTasks = {};
                for (const col of ['todo', 'in_progress', 'done']) {
                    newTasks[col] = (prev[col] || []).map(t => t._id === taskId ? updated : t);
                }
                return newTasks;
            });
        } catch {
            if (addToast) addToast('Failed to update task', 'error');
        }
    };

    // Drag-and-drop handlers
    const handleDrop = async (e, targetStatus) => {
        e.preventDefault();
        setDragOverCol(null);
        const taskId = e.dataTransfer.getData('taskId');
        const fromStatus = e.dataTransfer.getData('fromStatus');
        if (fromStatus === targetStatus) return;

        // Optimistic update
        setTasks(prev => {
            const task = (prev[fromStatus] || []).find(t => t._id === taskId);
            if (!task) return prev;
            return {
                ...prev,
                [fromStatus]: (prev[fromStatus] || []).filter(t => t._id !== taskId),
                [targetStatus]: [...(prev[targetStatus] || []), { ...task, status: targetStatus }]
            };
        });

        try {
            await tasksApi.update(room.id, taskId, { status: targetStatus });
        } catch {
            loadTasks(); // Revert on failure
            if (addToast) addToast('Failed to move task', 'error');
        }
    };

    const totalTasks = (tasks.todo?.length || 0) + (tasks.in_progress?.length || 0) + (tasks.done?.length || 0);
    const doneCount = tasks.done?.length || 0;
    const progressPct = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-pulse text-brand-text-dim text-sm font-bold">Loading board...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-3 min-h-0 h-full overflow-y-auto lg:overflow-hidden custom-scrollbar">
            {/* Progress bar */}
            <div className="bg-brand-card rounded-2xl p-3 border border-brand-border shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim">Project Progress</span>
                    <span className="text-[11px] font-black text-brand-primary">{progressPct}%</span>
                </div>
                <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-brand-primary to-emerald-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
                <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] text-brand-text-dim">{doneCount}/{totalTasks} tasks complete</span>
                    {totalTasks > 0 && doneCount === totalTasks && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase">🎉 All done!</span>
                    )}
                </div>
            </div>

            {/* Deadline bar */}
            <DeadlineBar tasks={tasks} />

            {/* Kanban columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0 lg:overflow-hidden">
                {COLUMNS.map(col => (
                    <div
                        key={col.key}
                        className={`flex flex-col rounded-2xl border transition-all min-h-[200px] lg:min-h-0 lg:overflow-hidden ${
                            dragOverCol === col.key
                                ? 'border-brand-primary/50 bg-brand-primary/5'
                                : 'border-brand-border bg-brand-surface/50'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
                        onDragLeave={() => setDragOverCol(null)}
                        onDrop={(e) => handleDrop(e, col.key)}
                    >
                        {/* Column header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-brand-border/30 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{col.emoji}</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-brand-text">{col.label}</span>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                col.key === 'done' ? 'bg-emerald-500/15 text-emerald-500' :
                                col.key === 'in_progress' ? 'bg-blue-500/15 text-blue-500' :
                                'bg-brand-primary/15 text-brand-primary'
                            }`}>
                                {(tasks[col.key] || []).length}
                            </span>
                        </div>

                        {/* Task cards */}
                        <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                            {(tasks[col.key] || []).map(task => (
                                <TaskCardComponent
                                    key={task._id}
                                    task={task}
                                    currentUser={currentUser}
                                    onUpdate={handleUpdateTask}
                                    onDelete={handleDeleteTask}
                                    onClaim={handleClaimTask}
                                    members={room.members}
                                />
                            ))}

                            {col.key === 'todo' && (
                                <AddTaskForm onAdd={handleAddTask} members={room.members} />
                            )}

                            {(tasks[col.key] || []).length === 0 && col.key !== 'todo' && (
                                <div className="flex flex-col items-center justify-center py-8 text-brand-text-dim/40">
                                    <AlertCircle size={24} className="mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">
                                        {col.key === 'in_progress' ? 'Drag tasks here' : 'Nothing completed yet'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default BoardTab;
