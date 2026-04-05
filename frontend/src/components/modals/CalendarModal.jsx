// src/components/modals/CalendarModal.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function CalendarModal({ onClose, openConfirm }) {
    const { user } = useAuth();
    const storageKey = `Crammerly_calendar_tasks_${user?.id || user?._id || 'guest'}`;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [showTaskForm, setShowTaskForm] = useState(null); // { day, task? }
    const [editingTask, setEditingTask] = useState(null);

    // Load data from localStorage on mount
    useEffect(() => {
        const savedTasks = localStorage.getItem(storageKey);
        if (savedTasks) {
            try {
                const parsed = JSON.parse(savedTasks);
                setTasks((Array.isArray(parsed) ? parsed : []).map(t => ({ ...t, date: new Date(t.date) })));
            } catch (e) {
                console.error("Failed to parse calendar tasks", e);
                setTasks([]);
            }
        }
    }, [storageKey]);

    // Save data to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    }, [tasks, storageKey]);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const handleAddTask = (day) => {
        setEditingTask(null);
        setShowTaskForm({ day });
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setShowTaskForm({ day: task.date.getDate() });
    };

    const handleDeleteTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        openConfirm({
            title: 'Delete Task',
            message: `Remove "${task?.text}" from your schedule?`,
            onConfirm: () => {
                setTasks(tasks.filter(t => t.id !== taskId));
            },
            type: 'danger',
            confirmText: 'Delete'
        });
    };

    const saveTask = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const text = formData.get('text');
        const time = formData.get('time');

        if (!text) return;

        if (editingTask) {
            setTasks(tasks.map(t => t.id === editingTask.id ? {
                ...t,
                text,
                time
            } : t));
        } else {
            const newTask = {
                id: Date.now(),
                date: new Date(currentYear, currentMonth, showTaskForm.day),
                text,
                time
            };
            setTasks([...tasks, newTask]);
        }
        setShowTaskForm(null);
        setEditingTask(null);
    };

    const renderCalendar = () => {
        const days = [];
        const currentMonthDays = daysInMonth(currentYear, currentMonth);
        const startDay = firstDayOfMonth(currentYear, currentMonth);

        // Padding from prev month
        for (let i = startDay - 1; i >= 0; i--) {
            days.push(
                <div key={`prev-${i}`} className="min-h-[50px] sm:min-h-[60px] p-1 sm:p-2 border-r border-b border-brand-border/30 bg-brand-bg/30 overflow-hidden">
                </div>
            );
        }

        // Days of current month
        for (let i = 1; i <= currentMonthDays; i++) {
            const dayTasks = tasks.filter(t =>
                t.date.getDate() === i &&
                t.date.getMonth() === currentMonth &&
                t.date.getFullYear() === currentYear
            );

            const isToday = i === new Date().getDate() &&
                currentMonth === new Date().getMonth() &&
                currentYear === new Date().getFullYear();

            days.push(
                <div
                    key={`day-${i}`}
                    className={`min-h-[50px] sm:min-h-[60px] p-1 sm:p-2 border-r border-b border-brand-border/30 group hover:bg-brand-primary/5 transition-colors relative overflow-hidden flex flex-col ${isToday ? 'bg-brand-primary/10' : ''}`}
                    onDoubleClick={() => handleAddTask(i)}
                >
                    <div className="flex justify-between items-start mb-0.5 sm:mb-1 shrink-0">
                        <span className={`text-[12px] sm:text-[14px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${isToday ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text/60'}`}>{i}</span>
                        <button
                            onClick={() => handleAddTask(i)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-brand-primary hover:bg-brand-primary/10 rounded transition-all"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <div className="space-y-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
                        {dayTasks.map(task => {
                            return (
                                <div
                                    key={task.id}
                                    className="group/task relative p-1.5 rounded-md text-[11px] leading-tight font-bold cursor-pointer transition-all hover:scale-[1.02] text-brand-text bg-brand-primary/10"
                                    onClick={() => handleEditTask(task)}
                                >
                                    <div className="flex justify-between items-start pr-4">
                                        <span>{task.time ? `${task.time} ` : ''}{task.text}</span>
                                        <div className="absolute right-1 top-1 hidden group-hover/task:flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Padding to complete the last row
        const remainingSlots = (7 - (days.length % 7)) % 7;
        for (let i = 1; i <= remainingSlots; i++) {
            days.push(
                <div key={`next-${i}`} className="min-h-[50px] sm:min-h-[60px] p-1 sm:p-2 border-r border-b border-brand-border/30 bg-brand-bg/30 overflow-hidden">
                </div>
            );
        }

        return days;
    };

    return (
        <div className="fixed inset-0 bg-brand-bg/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 z-[150] animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-brand-surface rounded-[32px] w-full max-w-4xl h-fit max-h-[95vh] flex flex-col shadow-premium border border-brand-border/30 overflow-hidden relative font-sans" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-3 sm:gap-4">
                    <span className="text-[10px] sm:text-[14px] font-black text-brand-text-dim/40 tracking-[0.2em] sm:tracking-[0.3em] uppercase">/ {currentYear}</span>
                    <button onClick={onClose} className="p-2 bg-brand-muted/10 hover:bg-brand-muted/20 text-brand-text rounded-xl transition-all">
                        <X size={20} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 flex flex-col mt-4 sm:mt-0">

                    {/* Month Header */}
                    <div className="flex items-center justify-center mb-3 sm:mb-4 gap-4 sm:gap-12 text-center">
                        <button onClick={prevMonth} className="p-2 text-brand-text-dim hover:text-brand-text transition-all">
                            <ChevronLeft size={24} className="sm:w-8 sm:h-8" />
                        </button>
                        <div className="flex flex-col items-center">
                            <h4 className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.6em] text-brand-text/40 uppercase mb-1 sm:mb-2">Content Schedule</h4>
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-[0.2em] sm:tracking-[0.4em] text-brand-text uppercase leading-none">
                                {monthNames[currentMonth]}
                            </h2>
                        </div>
                        <button onClick={nextMonth} className="p-2 text-brand-text-dim hover:text-brand-text transition-all">
                            <ChevronRight size={24} className="sm:w-8 sm:h-8" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex flex-col">
                        <div className="grid grid-cols-7 text-center mb-1 sm:mb-2 gap-0 shrink-0">
                            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                                <div key={day} className="text-[9px] sm:text-[11px] font-black text-brand-text/40 tracking-[0.2em] py-1 sm:py-2 uppercase truncate px-0.5">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 border-t border-l border-brand-border/30 rounded-xl overflow-hidden">
                            {renderCalendar()}
                        </div>
                    </div>
                </div>

                {/* Task Form Modal */}
                {showTaskForm && (
                    <div className="fixed inset-0 bg-brand-bg/40 backdrop-blur-sm z-[1000001] flex items-center justify-center p-4">
                        <div className="bg-brand-surface rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-brand-border/30 font-sans">
                            <h3 className="text-2xl font-black text-brand-text mb-6 uppercase tracking-tight">
                                {editingTask ? 'Edit Task' : `Add Task for ${monthNames[currentMonth]} ${showTaskForm.day}`}
                            </h3>
                            <form onSubmit={saveTask} className="space-y-6">
                                <div>
                                    <label className="block text-[11px] font-black text-brand-text-dim uppercase tracking-widest mb-2">Time (e.g., 9am)</label>
                                    <input
                                        name="time"
                                        type="text"
                                        defaultValue={editingTask?.time || ''}
                                        placeholder="9:15am"
                                        className="w-full px-4 py-3 bg-brand-muted/10 border-2 border-brand-border/30 rounded-2xl text-sm font-bold focus:border-brand-primary outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-brand-text-dim uppercase tracking-widest mb-2">Task Description</label>
                                    <textarea
                                        name="text"
                                        required
                                        defaultValue={editingTask?.text || ''}
                                        placeholder="Tape Reading"
                                        className="w-full px-4 py-3 bg-brand-muted/10 border-2 border-brand-border/30 rounded-2xl text-sm font-bold focus:border-brand-primary outline-none transition-all h-32 resize-none"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTaskForm(null)}
                                        className="flex-1 py-3 text-brand-text font-black text-xs uppercase tracking-widest hover:bg-brand-muted/10 rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-brand-text text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        {editingTask ? 'Save Changes' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CalendarModal;
