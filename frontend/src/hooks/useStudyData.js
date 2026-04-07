// src/hooks/useStudyData.js
import { useState, useEffect } from 'react';
import { todosApi, studyApi, friendsApi } from '../api';

/**
 * Manages study-related data: todos, journal entries, study notes, friends, and study stats.
 * Bootstraps all data on auth.
 */
export function useStudyData({ authUser, currentUser, addToast, openConfirm }) {
    const [todos, setTodos] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [studyNotes, setStudyNotes] = useState([]);
    const [friends, setFriends] = useState([]);
    const [studyStats, setStudyStats] = useState({ totalMinutes: 0, sessionCount: 0 });

    // ── Bootstrap all data on auth ──
    useEffect(() => {
        if (!authUser) return;

        const bootstrap = async () => {
            const userId = authUser._id || authUser.id;
            try {
                const [tData, jData, nData, fData, stats] = await Promise.allSettled([
                    todosApi.getAll(userId),
                    studyApi.journal.getAll(userId),
                    studyApi.notes.getAll(userId),
                    friendsApi.getAll(userId),
                    studyApi.sessions.getStats()
                ]);

                if (tData.status === 'fulfilled' && Array.isArray(tData.value)) setTodos(tData.value);
                else setTodos([]);

                if (jData.status === 'fulfilled' && Array.isArray(jData.value)) setJournalEntries(jData.value);
                else setJournalEntries([]);

                if (nData.status === 'fulfilled' && Array.isArray(nData.value)) setStudyNotes(nData.value);
                else setStudyNotes([]);

                if (fData.status === 'fulfilled' && Array.isArray(fData.value)) setFriends(fData.value);
                else setFriends([]);
                if (stats.status === 'fulfilled') setStudyStats(stats.value);

                const failed = [tData, jData, nData, fData, stats].filter(r => r.status === 'rejected');
                if (failed.length > 0) {
                    console.error('Some bootstrap requests failed:', failed);
                    addToast('Some data failed to load. Pull down to refresh.', 'warning');
                }
            } catch (err) {
                console.error('Failed to bootstrap user data:', err);
                addToast('Some data failed to load. Pull down to refresh.', 'warning');
            }
        };
        bootstrap();
    }, [authUser, addToast]);

    // ── Refresh study stats ──
    const refreshStats = async () => {
        try {
            const stats = await studyApi.sessions.getStats();
            setStudyStats(stats);
        } catch (err) {
            console.error('Failed to refresh study stats:', err);
        }
    };

    // ── Todo CRUD ──
    const addTodo = async (text) => {
        try {
            const newTodo = await todosApi.create(text);
            if (newTodo) {
                setTodos(prev => [...prev, newTodo]);
                addToast('Task added!', 'success');
            }
        } catch (err) { console.error('Add todo error:', err); }
    };

    const toggleTodo = async (id) => {
        try {
            const updated = await todosApi.toggle(id);
            if (updated) setTodos(prev => prev.map(t => t.id === id ? updated : t));
        } catch (err) { console.error(err); }
    };

    const deleteTodo = (id) => {
        const todo = todos.find(t => t.id === id);
        openConfirm({
            title: 'Delete Task',
            message: `Remove "${todo?.text}"?`,
            onConfirm: async () => {
                const success = await todosApi.delete(id);
                if (success) {
                    setTodos(prev => prev.filter(t => t.id !== id));
                    addToast('Task removed', 'info');
                }
            },
            type: 'danger'
        });
    };

    // ── Journal CRUD ──
    const addJournalEntry = async (content) => {
        if (!currentUser?.id) { addToast('Please sign in to save entries', 'error'); return; }
        try {
            const newEntry = await studyApi.journal.create(content);
            setJournalEntries(prev => [newEntry, ...prev]);
            addToast('Reflection saved', 'success');
        } catch (error) { console.error(error); }
    };

    const deleteJournalEntry = (id) => {
        openConfirm({
            title: 'Delete Entry', message: 'Sure?',
            onConfirm: async () => {
                try {
                    await studyApi.journal.delete(id);
                    setJournalEntries(prev => prev.filter(e => e.id !== id));
                    addToast('Entry deleted', 'info');
                } catch (error) { console.error(error); }
            },
            type: 'danger'
        });
    };

    // ── Study Notes CRUD ──
    const addStudyNote = async (title, content) => {
        if (!currentUser?.id) { addToast('Please sign in to save notes', 'error'); return; }
        try {
            const newNote = await studyApi.notes.create(title, content);
            setStudyNotes(prev => [newNote, ...prev]);
            addToast('Note saved', 'success');
        } catch (error) { console.error(error); }
    };

    const deleteStudyNote = (id) => {
        openConfirm({
            title: 'Delete Note', message: 'Sure?',
            onConfirm: async () => {
                try {
                    await studyApi.notes.delete(id);
                    setStudyNotes(prev => prev.filter(n => n.id !== id));
                    addToast('Note deleted', 'info');
                } catch (error) { console.error(error); }
            },
            type: 'danger'
        });
    };

    return {
        todos, addTodo, toggleTodo, deleteTodo,
        journalEntries, addJournalEntry, deleteJournalEntry,
        studyNotes, addStudyNote, deleteStudyNote,
        friends, setFriends,
        studyStats, refreshStats
    };
}
