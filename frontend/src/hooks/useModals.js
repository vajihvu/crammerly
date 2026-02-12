import { useState, useCallback } from 'react';

export const useModals = () => {
    const [modals, setModals] = useState({
        join: false,
        search: false,
        friends: false,
        profile: false,
        streak: false,
        auth: false,
        blogsModal: false,
        blogsDropdown: false,
        calendar: false,
        menu: false,
        notifications: false,
        settings: false,
        activity: false,
        help: false,
        bug: false,
        about: false,
        floating: null, // 'chatbot', 'todo', 'notebook', 'trending'
        confirm: null, // { title, message, onConfirm, type: 'danger'|'info' }
    });

    const openModal = useCallback((name) => {
        setModals((prev) => ({
            ...prev,
            [name]: true,
            // Automatically close small overlays if opening a main modal
            menu: name === 'menu' ? true : false,
            notifications: name === 'notifications' ? true : false,
            blogsDropdown: name === 'blogsDropdown' ? true : false,
            floating: null // Clear floating panel when opening any modal
        }));
    }, []);

    const closeModal = useCallback((name) => {
        setModals((prev) => ({
            ...prev,
            [name]: false,
        }));
    }, []);

    const toggleModal = useCallback((name) => {
        setModals((prev) => {
            const newState = !prev[name];
            return {
                ...prev,
                [name]: newState,
                // If opening one, close others
                ...(newState ? {
                    menu: name === 'menu' ? true : false,
                    notifications: name === 'notifications' ? true : false,
                    blogsDropdown: name === 'blogsDropdown' ? true : false,
                    floating: null // Clear floating panel when opening a modal/dropdown
                } : {})
            };
        });
    }, []);

    const setFloatingPanel = useCallback((panel) => {
        setModals((prev) => ({
            ...prev,
            floating: panel,
            // Only close other things when opening a floating panel
            ...(panel ? {
                menu: false,
                notifications: false,
                blogsDropdown: false,
                // Also close major modals? Usually floating panels coexist with main view, 
                // but let's keep it simple for now as per current design.
            } : {})
        }));
    }, []);

    const resetModals = useCallback(() => {
        setModals({
            join: false,
            search: false,
            friends: false,
            profile: false,
            streak: false,
            auth: false,
            blogsModal: false,
            blogsDropdown: false,
            calendar: false,
            menu: false,
            notifications: false,
            settings: false,
            activity: false,
            help: false,
            bug: false,
            about: false,
            floating: null,
            confirm: null,
        });
    }, []);

    const openConfirm = useCallback((config) => {
        setModals(prev => ({ ...prev, confirm: config }));
    }, []);

    const closeConfirm = useCallback(() => {
        setModals(prev => ({ ...prev, confirm: null }));
    }, []);

    const isAnyModalOpen = !!(
        modals.join ||
        modals.search ||
        modals.friends ||
        modals.profile ||
        modals.streak ||
        modals.auth ||
        modals.blogsModal ||
        modals.calendar ||
        modals.menu ||
        modals.notifications ||
        modals.settings ||
        modals.activity ||
        modals.help ||
        modals.bug ||
        modals.about ||
        modals.floating ||
        modals.confirm
    );

    return {
        modals,
        setModals,
        openModal,
        closeModal,
        toggleModal,
        setFloatingPanel,
        resetModals,
        isAnyModalOpen,
        openConfirm,
        closeConfirm
    };
};
