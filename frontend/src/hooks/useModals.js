import { useState, useCallback, useEffect } from 'react';

const INITIAL_MODALS = {
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
    createRoom: false,
    welcome: false,
    notebook: false,
    todo: false,
    chatbot: false,
    floating: null, // 'chatbot', 'todo', 'notebook', 'trending'
    confirm: null, // { title, message, onConfirm, type: 'danger'|'info' }
};

export const useModals = () => {
    const [modals, setModals] = useState(INITIAL_MODALS);

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
            ...(panel ? {
                menu: false,
                notifications: false,
                blogsDropdown: false,
            } : {})
        }));
    }, []);

    const resetModals = useCallback(() => {
        setModals(INITIAL_MODALS);
    }, []);

    const openConfirm = useCallback((config) => {
        setModals(prev => ({ ...prev, confirm: config }));
    }, []);

    const closeConfirm = useCallback(() => {
        setModals(prev => ({ ...prev, confirm: null }));
    }, []);

    // Auto-detect if any modal is open (no manual key listing needed)
    const isAnyModalOpen = Object.entries(modals).some(
        ([, val]) => val !== false && val !== null
    );

    // Global Escape key handler — closes the topmost open modal
    useEffect(() => {
        if (!isAnyModalOpen) return;

        const handleEscape = (e) => {
            if (e.key !== 'Escape') return;

            // Priority: confirm > floating > regular modals (last opened)
            if (modals.confirm) {
                closeConfirm();
                return;
            }
            if (modals.floating) {
                setFloatingPanel(null);
                return;
            }

            // Close the first open boolean modal found
            const openModal = Object.entries(modals).find(
                ([key, val]) => val === true && key !== 'auth' // Don't close auth via Escape
            );
            if (openModal) {
                setModals(prev => ({ ...prev, [openModal[0]]: false }));
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [modals, isAnyModalOpen, closeConfirm, setFloatingPanel]);

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
