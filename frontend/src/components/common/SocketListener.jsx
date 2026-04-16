import { useEffect } from 'react';
import { getSocket } from '../../utils/socket';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

function SocketListener() {
    const { addToast } = useUI();
    const { user } = useAuth();

    useEffect(() => {
        const socket = getSocket();
        if (!socket || !user) return;

        const handleNewNotification = (notif) => {
            // Only show toast if it's not a generic notification that the UI might handle elsewhere
            addToast(notif.content, 'info');
        };

        const handleNewMessage = (msg) => {
            // Don't show toast if it's from current user (shouldn't happen on this event)
            if (msg.senderId === user.user?._id || msg.senderId === user._id) return;
            
            addToast(`New message from ${msg.senderName || 'a friend'}`, 'info');
        };

        socket.on('new_notification', handleNewNotification);
        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_notification', handleNewNotification);
            socket.off('new_message', handleNewMessage);
        };
    }, [user, addToast]);

    return null; // This component has no UI, it just listens
}

export default SocketListener;
