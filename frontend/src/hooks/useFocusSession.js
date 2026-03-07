// src/hooks/useFocusSession.js
import { useState } from 'react';
import { studyApi } from '../api';

/**
 * Manages focus/study session state: start, end, and stat refresh.
 */
export function useFocusSession({ addToast, onStatsRefresh }) {
    const [focusSession, setFocusSession] = useState(null);

    const startFocusSession = async (roomId, task) => {
        try {
            const session = await studyApi.sessions.start(roomId, task);
            setFocusSession(session);
            addToast('Focus session started! Time to study.', 'success');
        } catch (err) {
            console.error('Failed to start focus session:', err);
        }
    };

    const endFocusSession = async () => {
        if (!focusSession) return;
        try {
            await studyApi.sessions.end(focusSession._id);
            setFocusSession(null);
            addToast('Focus session ended. Well done!', 'success');
            if (onStatsRefresh) onStatsRefresh();
        } catch (err) {
            console.error('Failed to end focus session:', err);
        }
    };

    return { focusSession, startFocusSession, endFocusSession };
}
