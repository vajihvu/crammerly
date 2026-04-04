// src/Crammer.jsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useModals } from '../hooks/useModals';
import { useRooms } from '../hooks/useRooms';
import { useStudyData } from '../hooks/useStudyData';
import { useFocusSession } from '../hooks/useFocusSession';
import { Sparkles } from 'lucide-react';

import HomeView from '../components/HomeView';
import RoomView from '../components/RoomView';
import MenuSidebar from '../components/MenuSidebar';
import NotificationsDropdown from '../components/NotificationsDropdown';
import ModalPortal from '../components/ModalPortal';
import storage from '../utils/storage';
import Header from '../components/layout/Header';
import { ToastContainer } from '../components/utils/Toast';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { usersApi, messagesApi } from '../api';
import ConnectionBanner from '../components/ui/ConnectionBanner';

// Lazy-loaded modals (code-split — only loaded when first opened)
const JoinByCodeModal = lazy(() => import('../components/modals/JoinByCodeModal'));
const GlobalSearchModal = lazy(() => import('../components/modals/GlobalSearchModal'));
const CreateRoomModal = lazy(() => import('../components/modals/CreateRoomModal'));
const FriendsModal = lazy(() => import('../components/modals/FriendsModal'));
const ProfileModal = lazy(() => import('../components/modals/ProfileModal'));
const AuthModal = lazy(() => import('../components/modals/AuthModal'));
const NotebookModal = lazy(() => import('../components/modals/NotebookModal'));
const TodoListModal = lazy(() => import('../components/modals/TodoListModal'));
const ChatbotModal = lazy(() => import('../components/modals/ChatbotModal'));
const BlogsModal = lazy(() => import('../components/modals/BlogsModal'));
const CalendarModal = lazy(() => import('../components/modals/CalendarModal'));
const ConfirmModal = lazy(() => import('../components/modals/ConfirmModal'));
const SettingsModal = lazy(() => import('../components/modals/SettingsModal'));
const HelpModal = lazy(() => import('../components/modals/HelpModal'));
const BugReportModal = lazy(() => import('../components/modals/BugReportModal'));
const AboutModal = lazy(() => import('../components/modals/AboutModal'));
const WelcomeModal = lazy(() => import('../components/modals/WelcomeModal'));


// Ensure window.storage is available
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = storage;
}

export default function Crammerly() {
  const { user: authUser, loading: isAuthLoading, logout: handleAuthLogout } = useAuth();
  const { addToast } = useUI();
  const { modals, openModal, closeModal, toggleModal, setFloatingPanel, resetModals, isAnyModalOpen, openConfirm, closeConfirm } = useModals();

  // ── Local UI state ──
  const [view, setView] = useState('home');
  const [activeTab, setActiveTab] = useState('chat');
  const [theme, setTheme] = useState(localStorage.getItem('crammer_theme') || 'light');
  const [userStatus, setUserStatus] = useState('online');
  const [isFirstVisit, setIsFirstVisit] = useState(() => !localStorage.getItem('crammer_not_first_visit'));

  // Derived from authUser via the sync useEffect below — never read from stale localStorage
  const [currentUser, setCurrentUser] = useState(null);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('crammer_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentActivity, setRecentActivity] = useState(() => {
    const saved = localStorage.getItem('crammer_recent_activity');
    return saved ? JSON.parse(saved) : [];
  });

  // ── Composed hooks ──
  const {
    rooms, loadingRooms, roomsError, loadRooms,
    currentRoom, setCurrentRoom, isInRoom, setIsInRoom,
    createRoom, joinRoom, joinRoomByCode, leaveRoom: leaveRoomBase, deleteRoom,
    markProgress, updateRoom
  } = useRooms({ authUser, currentUser, addToast, openConfirm });

  const {
    todos, addTodo, toggleTodo, deleteTodo,
    journalEntries, addJournalEntry, deleteJournalEntry,
    studyNotes, addStudyNote, deleteStudyNote,
    friends, setFriends,
    refreshStats
  } = useStudyData({ authUser, currentUser, addToast, openConfirm });

  const { focusSession, startFocusSession, endFocusSession } = useFocusSession({ addToast, onStatsRefresh: refreshStats });

  // ── Wrap leaveRoom to also end focus session ──
  const leaveRoom = () => {
    if (focusSession) endFocusSession();
    leaveRoomBase();
    setView('home');
  };

  // ── Auth sync ──
  useEffect(() => {
    if (authUser) {
      // eslint-disable-next-line
      setCurrentUser(prev => ({
        ...prev,
        ...authUser,
        id: authUser._id || authUser.id
      }));
    }
  }, [authUser]);

  // ── Theme ──
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('crammer_theme', theme);
  }, [theme]);

  // ── Auth modal / welcome modal ──
  useEffect(() => {
    if (!authUser) {
      if (!modals.auth) openModal('auth');
    } else {
      if (modals.auth) closeModal('auth');
      if (isFirstVisit) {
        setTimeout(() => {
          openModal('welcome');
          localStorage.setItem('crammer_not_first_visit', 'true');
          setIsFirstVisit(false);
        }, 0);
      }
    }
  }, [authUser, isFirstVisit, openModal, modals.auth, closeModal]);

  // ── Body overflow lock when modal open ──
  useEffect(() => {
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAnyModalOpen]);

  // ── Track recent activity ──
  const trackActivity = (activity) => {
    setRecentActivity(prev => {
      const filtered = prev.filter(a => a.id !== activity.id);
      const updated = [{ ...activity, timestamp: new Date().toISOString() }, ...filtered].slice(0, 10);
      localStorage.setItem('crammer_recent_activity', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Notifications ──
  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('crammer_notifications');
    addToast('All notifications cleared', 'info');
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('crammer_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Profile ──
  const updateUserProfile = async (updatedData) => {
    const prevUser = { ...currentUser };
    setCurrentUser({ ...currentUser, ...updatedData });
    try {
      await usersApi.updateProfile(updatedData);
      addToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setCurrentUser(prevUser);
    }
  };

  // ── Send message (used by RoomView) ──
  const sendMessage = async (text, type = 'text', fileData = null) => {
    if (!text.trim() && !fileData && type !== 'sticker') return;
    if (!currentRoom) return;
    try {
      await messagesApi.send(currentRoom.id, { content: text, type, fileData });
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  // ── Navigation helpers ──
  const resetToHome = () => {
    setView('home');
    resetModals();
    setCurrentRoom(null);
    setIsInRoom(false);
  };

  const handleRoomClick = (room) => {
    trackActivity({ id: room.id, title: room.name, type: 'room', genre: room.topic });
    joinRoom(room).then(() => setView('room'));
  };

  const handleCreateRoom = async (...args) => {
    const success = await createRoom(...args);
    if (success) setView('room');
  };

  // ─────────────── RENDER ───────────────

  if (isAuthLoading || (authUser && !currentUser)) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
        <Sparkles className="text-brand-primary animate-spin-slow" size={48} />
        <h2 className="mt-8 text-xl font-black text-brand-text uppercase tracking-widest">Initializing Crammerly</h2>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
        <Sparkles className="text-brand-primary" size={48} />
        <h2 className="mt-6 text-xl font-black text-brand-text uppercase tracking-widest">Crammerly</h2>
        <p className="mt-2 text-sm text-brand-text-dim">Sign in to get started</p>
        <ModalPortal>
          {modals.auth && <Suspense fallback={null}><AuthModal closable={false} onClose={() => closeModal('auth')} /></Suspense>}
        </ModalPortal>
      </div>
    );
  }

  return (
    <div className={`!bg-brand-bg font-sans selection:bg-brand-primary/30 relative flex flex-col ${isInRoom ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Header
        isInRoom={isInRoom}
        leaveRoom={leaveRoom}
        modals={modals}
        toggleModal={toggleModal}
        openModal={openModal}
        closeModal={closeModal}
        unreadCount={(notifications || []).filter(n => !n.read).length}
        notifications={notifications}
        markNotificationAsRead={markNotificationAsRead}
        clearAllNotifications={clearAllNotifications}
        currentUser={currentUser}
      />

      <main className={`flex-1 flex flex-col relative ${isInRoom ? 'min-h-0 overflow-hidden' : ''}`}>
        <div className={`max-w-7xl mx-auto w-full px-4 flex-1 flex flex-col ${isInRoom ? 'pt-2 pb-2 min-h-0 overflow-hidden' : 'py-4'}`}>
          {view === 'home' && (
            <HomeView
              rooms={rooms}
              loadingRooms={loadingRooms}
              roomsError={roomsError}
              onRetryRooms={loadRooms}
              currentUser={currentUser}
              onCreateRoom={() => openModal('createRoom')}
              onRoomClick={handleRoomClick}
              onDeleteRoom={deleteRoom}
              onJoinByCode={() => openModal('join')}
              onSearchClick={() => openModal('search')}
              recentActivity={recentActivity}
              addToast={addToast}
            />
          )}
          {isInRoom && currentRoom && (
            <RoomView
              room={currentRoom}
              currentUser={currentUser}
              onMarkProgress={markProgress}
              onDeleteRoom={deleteRoom}
              onSendMessage={sendMessage}
              onLeaveRoom={leaveRoom}
              onUpdateRoom={updateRoom}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              addToast={addToast}
              focusSession={focusSession}
              onStartFocus={startFocusSession}
              onEndFocus={endFocusSession}
            />
          )}
        </div>
      </main>

      <ConnectionBanner />

      <ModalPortal>
        <Suspense fallback={null}>
          {modals.menu && (
            <MenuSidebar
              setShowMenu={(val) => val ? openModal('menu') : closeModal('menu')}
              userStatus={userStatus}
              setUserStatus={setUserStatus}
              setShowFriendsModal={() => openModal('friends')}
              setShowCalendarModal={() => openModal('calendar')}
              setShowSearchModal={() => openModal('search')}
              setShowBlogsModal={() => openModal('blogsModal')}
              setShowSettingsModal={() => openModal('settings')}
              setShowHelpModal={() => openModal('help')}
              setShowBugModal={() => openModal('bug')}
              setShowAboutModal={() => openModal('about')}
              currentUser={currentUser}
              theme={theme}
              setTheme={setTheme}
              handleSignOut={handleAuthLogout}
            />
          )}

          {modals.createRoom && <CreateRoomModal onClose={() => closeModal('createRoom')} onCreateRoom={handleCreateRoom} addToast={addToast} />}
          {modals.join && <JoinByCodeModal onClose={resetToHome} onJoin={joinRoomByCode} />}
          {modals.search && <GlobalSearchModal onClose={resetToHome} onJoinRoom={joinRoom} />}
          {modals.friends && <FriendsModal currentUser={currentUser} onClose={resetToHome} friendsList={friends} setFriendsList={setFriends} addToast={addToast} />}
          {modals.profile && <ProfileModal currentUser={currentUser} onUpdateProfile={updateUserProfile} onClose={resetToHome} />}
          {modals.auth && <AuthModal closable={!!authUser} onClose={() => closeModal('auth')} onSuccess={() => { setIsInRoom(false); closeModal('auth'); }} />}
          {modals.notebook && <NotebookModal journalEntries={journalEntries} studyNotes={studyNotes} onAddJournalEntry={addJournalEntry} onDeleteJournalEntry={deleteJournalEntry} onAddStudyNote={addStudyNote} onDeleteStudyNote={deleteStudyNote} onClose={resetToHome} />}
          {modals.todo && <TodoListModal todos={todos} onAddTodo={addTodo} onToggleTodo={toggleTodo} onDeleteTodo={deleteTodo} onClose={resetToHome} />}
          {modals.floating === 'notebook' && <NotebookModal journalEntries={journalEntries} studyNotes={studyNotes} onAddJournalEntry={addJournalEntry} onDeleteJournalEntry={deleteJournalEntry} onAddStudyNote={addStudyNote} onDeleteStudyNote={deleteStudyNote} onClose={() => setFloatingPanel(null)} />}
          {modals.floating === 'todo' && <TodoListModal todos={todos} onAddTodo={addTodo} onToggleTodo={toggleTodo} onDeleteTodo={deleteTodo} onClose={() => setFloatingPanel(null)} />}
          {modals.floating === 'chatbot' && <ChatbotModal onClose={() => setFloatingPanel(null)} />}
          {modals.notifications && (
            <NotificationsDropdown
              notifications={notifications}
              setShowNotifications={(val) => val ? openModal('notifications') : closeModal('notifications')}
              clearAllNotifications={clearAllNotifications}
              markNotificationAsRead={markNotificationAsRead}
              isPortal={true}
            />
          )}
          {modals.chatbot && <ChatbotModal onClose={resetToHome} />}
          {modals.blogsModal && <BlogsModal onClose={resetToHome} currentUser={currentUser} />}
          {modals.calendar && <CalendarModal onClose={resetToHome} />}
          {modals.settings && <SettingsModal onClose={resetToHome} />}
          {modals.help && <HelpModal onClose={resetToHome} />}
          {modals.bug && <BugReportModal onClose={resetToHome} />}
          {modals.about && <AboutModal onClose={resetToHome} />}
          {modals.welcome && <WelcomeModal onClose={resetToHome} />}
          {modals.confirm && <ConfirmModal config={modals.confirm} onClose={closeConfirm} />}
        </Suspense>
      </ModalPortal>
    </div>
  );
}
