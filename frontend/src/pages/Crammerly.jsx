// src/Crammer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useModals } from '../hooks/useModals';
import { Users, Plus, Bell, CheckCircle, LogOut, Trash2, X, Flame, EyeOff, Search, MessageCircle, Video, Send, UserPlus, Bot, Mic, MicOff, VideoOff, PhoneOff, TrendingUp, Loader, BookOpen, NotebookPen, Calendar as CalendarIcon, ChevronLeft, Sparkles } from 'lucide-react';
import { getSocket } from '../utils/socket';

import HomeView from '../components/HomeView';
import RoomView from '../components/RoomView';
import JoinByCodeModal from '../components/modals/JoinByCodeModal';
import GlobalSearchModal from '../components/modals/GlobalSearchModal';
import FriendsModal from '../components/modals/FriendsModal';
import ProfileModal from '../components/modals/ProfileModal';
import AuthModal from '../components/modals/AuthModal';
import NotebookModal from '../components/modals/NotebookModal';
import TodoListModal from '../components/modals/TodoListModal';
import ChatbotModal from '../components/modals/ChatbotModal';
import MenuSidebar from '../components/MenuSidebar';
import NotificationsDropdown from '../components/NotificationsDropdown';
import BlogsModal from '../components/modals/BlogsModal';
import CalendarModal from '../components/modals/CalendarModal';
import ModalPortal from '../components/ModalPortal';
import storage from '../utils/storage';
import Header from '../components/layout/Header';
import FloatingActions from '../components/layout/FloatingActions';
import ConfirmModal from '../components/modals/ConfirmModal';
import SettingsModal from '../components/modals/SettingsModal';
import ActivityModal from '../components/modals/ActivityModal';
import HelpModal from '../components/modals/HelpModal';
import BugReportModal from '../components/modals/BugReportModal';
import AboutModal from '../components/modals/AboutModal';
import WelcomeModal from '../components/modals/WelcomeModal';
import { ToastContainer } from '../components/utils/Toast';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { usersApi, roomsApi, todosApi, studyApi, friendsApi, messagesApi } from '../api';

// Ensure window.storage is available
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = storage;
}

export default function Crammerly() {
  const { user: authUser, loading: isAuthLoading, logout: handleAuthLogout } = useAuth();
  const { addToast } = useUI();
  const [view, setView] = useState('home');
  const [hasClosedAuth, setHasClosedAuth] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(() => {
    return !localStorage.getItem('crammer_not_first_visit');
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('crammer_user');
    return saved ? JSON.parse(saved) : {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'demo@user.com',
      name: 'Demo User',
      username: 'demouser',
      tag: '4821',
      institution: 'Demo University',
      course: 'Computer Science',
      bio: 'Passionate about learning and collaboration',
      friends: [],
      interests: ['Data Structures', 'Algorithms', 'Web Development'],
      skills: ['Python', 'JavaScript', 'React'],
      socialLinks: {
        github: '',
        linkedin: ''
      },
      avatarUrl: '',
      bannerColor: '#3b82f6'
    };
  });

  const [journalEntries, setJournalEntries] = useState([]);
  const [studyNotes, setStudyNotes] = useState([]);
  const [friends, setFriends] = useState([]);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('crammer_notifications');
    return saved ? JSON.parse(saved) : [
      { id: 1, type: 'room_invite', message: 'You were invited to "Advanced Algorithms"', time: new Date(Date.now() - 300000).toISOString(), read: false },
      { id: 2, type: 'progress', message: 'John completed a task in "DSA with ShaSmack911"', time: new Date(Date.now() - 600000).toISOString(), read: false },
      { id: 3, type: 'friend', message: 'Alex sent you a friend request', time: new Date(Date.now() - 900000).toISOString(), read: true },
      { id: 4, type: 'achievement', message: 'You reached a 5-day streak! 🔥', time: new Date(Date.now() - 1800000).toISOString(), read: true }
    ];
  });
  const [activeTab, setActiveTab] = useState('chat');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const { modals, openModal, closeModal, toggleModal, setFloatingPanel, resetModals, isAnyModalOpen, openConfirm, closeConfirm } = useModals();
  const [theme, setTheme] = useState(localStorage.getItem('crammer_theme') || 'light');
  const [recentActivity, setRecentActivity] = useState(() => {
    const saved = localStorage.getItem('crammer_recent_activity');
    return saved ? JSON.parse(saved) : [];
  });
  const [todos, setTodos] = useState([]);
  const [userStatus, setUserStatus] = useState('online');
  const [focusSession, setFocusSession] = useState(null);
  const [studyStats, setStudyStats] = useState({ totalMinutes: 0, sessionCount: 0 });


  useEffect(() => {
    if (authUser) {
      const fetchStats = async () => {
        try {
          const stats = await studyApi.sessions.getStats();
          setStudyStats(stats);
        } catch (err) {
          console.error('Failed to load study stats:', err);
        }
      };
      fetchStats();
    }
  }, [authUser]);

  // Bootstrap environment
  useEffect(() => {
    const bootstrap = async () => {
      const userId = authUser?._id || authUser?.id || '00000000-0000-0000-0000-000000000000';

      const tData = await todosApi.getAll(userId);
      setTodos(tData);

      const jData = await studyApi.journal.getAll(userId);
      setJournalEntries(jData);

      const nData = await studyApi.notes.getAll(userId);
      setStudyNotes(nData);

      const fData = await friendsApi.getAll(userId);
      setFriends(fData);
    };
    bootstrap();
  }, [authUser]);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('crammer_theme', theme);
  }, [theme]);


  useEffect(() => {
    if (!authUser) {
      if (!modals.auth && !hasClosedAuth) {
        openModal('auth');
      }
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
  }, [authUser, isFirstVisit, openModal, hasClosedAuth, modals.auth, closeModal]);

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAnyModalOpen]);

  const loadRooms = useCallback(async () => {
    try {
      const loadedRooms = await roomsApi.getAll();
      setRooms(loadedRooms);
    } catch (err) {
      console.error('Room loading error:', err);
    }
  }, []);


  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const loadedRooms = await roomsApi.getAll();
        setRooms(loadedRooms);
      } catch (err) {
        console.error('Room loading error:', err);
      }
    };
    fetchRooms();

    const socket = getSocket();
    if (socket) {
      const handleMemberJoined = ({ id, name }) => {
        setRooms(prev => prev.map(r => {
          if (r.id === currentRoom?.id) {
            const isAlreadyMember = r.members.some(m => m.id === id);
            if (!isAlreadyMember) {
              return { ...r, members: [...r.members, { id, name, progress: [] }] };
            }
          }
          return r;
        }));

        if (currentRoom) {
          setCurrentRoom(prev => {
            if (!prev) return prev;
            const isAlreadyMember = prev.members.some(m => m.id === id);
            if (isAlreadyMember) return prev;
            return { ...prev, members: [...prev.members, { id, name, progress: [] }] };
          });
        }
      };

      const handleProgressUpdated = ({ userId, progress }) => {
        setRooms(prev => prev.map(r => {
          if (r.id === currentRoom?.id) {
            return {
              ...r,
              members: r.members.map(m => m.id === userId ? { ...m, progress } : m)
            };
          }
          return r;
        }));

        if (currentRoom) {
          setCurrentRoom(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              members: prev.members.map(m => m.id === userId ? { ...m, progress } : m)
            };
          });
        }
      };

      socket.on('member_joined', handleMemberJoined);
      socket.on('progress_updated', handleProgressUpdated);

      return () => {
        socket.off('member_joined', handleMemberJoined);
        socket.off('progress_updated', handleProgressUpdated);
      };
    }
  }, [loadRooms, currentRoom]);

  const trackActivity = (activity) => {
    setRecentActivity(prev => {
      const filtered = prev.filter(a => a.id !== activity.id);
      const updated = [{ ...activity, timestamp: new Date().toISOString() }, ...filtered].slice(0, 10);
      localStorage.setItem('crammer_recent_activity', JSON.stringify(updated));
      return updated;
    });
  };

  const createRoom = async (roomName, task, topic, privacy, scheduleDate, scheduleTime) => {
    const newRoomData = {
      name: roomName,
      task,
      topic,
      privacy: privacy || 'Public',
      scheduleDate: scheduleDate || null,
      scheduleTime: scheduleTime || null
    };

    try {
      const createdRoom = await roomsApi.create(newRoomData);
      setRooms(prev => [createdRoom, ...prev]);
      setCurrentRoom(createdRoom);
      setIsInRoom(true);
      setView('room');
      addToast(`Room "${roomName}" created successfully!`, 'success');
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const joinRoom = async (room) => {
    try {
      await roomsApi.join(room.id);
      const userId = currentUser.id;

      const isAlreadyMember = room.members?.some(m => m.id === userId);
      const updatedRoom = {
        ...room,
        members: isAlreadyMember ? room.members : [...(room.members || []), { id: userId, name: currentUser.name, progress: [] }]
      };

      setCurrentRoom(updatedRoom);
      setIsInRoom(true);
      setView('room');
      setRooms(prev => prev.map(r => r.id === room.id ? updatedRoom : r));
      closeModal('join');
      closeModal('search');
      addToast(`Successfully joined ${room.name}!`, 'success');
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const joinRoomByCode = async (code) => {
    try {
      const room = await roomsApi.getByCode(code);
      if (!room) {
        addToast('Invalid room code or room not found', 'error');
        return;
      }
      await joinRoom(room);
    } catch (error) {
      console.error('Failed to join room by code:', error);
    }
  };

  const leaveRoom = () => {
    if (focusSession) {
      endFocusSession();
    }
    setCurrentRoom(null);
    setIsInRoom(false);
    setView('home');
    loadRooms();
  };

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
      try {
        const stats = await studyApi.sessions.getStats();
        setStudyStats(stats);
      } catch (err) {
        console.error('Failed to refresh study stats:', err);
      }
    } catch (err) {
      console.error('Failed to end focus session:', err);
    }
  };

  const deleteRoom = async (room, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const isOwner = room.creator_id === currentUser.id;
    if (isOwner) {
      openConfirm({
        title: 'Delete Room',
        message: `Are you sure you want to permanently delete "${room.name}"?`,
        onConfirm: async () => {
          try {
            await roomsApi.delete(room.id);
            if (currentRoom?.id === room.id) leaveRoom();
            setRooms(prev => prev.filter(r => r.id !== room.id));
            addToast('Room deleted successfully', 'success');
          } catch (error) {
            console.error('Failed to delete room:', error);
          }
        },
        type: 'danger',
        confirmText: 'Delete Room'
      });
    } else {
      if (currentRoom?.id === room.id) leaveRoom();
    }
  };

  const sendMessage = async (text, type = 'text', fileData = null) => {
    if (!text.trim() && !fileData && type !== 'sticker') return;
    if (!currentRoom) return;

    try {
      const messageContent = { content: text, type, fileData };
      await messagesApi.send(currentRoom.id, messageContent);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  const markProgress = async (taskText) => {
    if (!currentRoom || !taskText?.trim()) return;
    try {
      const newProgress = await roomsApi.updateProgress(currentRoom.id, { task: taskText });

      const userId = currentUser.id;
      const updatedMembers = currentRoom.members.map(m => m.id === userId ? { ...m, progress: newProgress } : m);
      const updatedRoom = { ...currentRoom, members: updatedMembers };

      setCurrentRoom(updatedRoom);
      addToast('Progress updated!', 'success');
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const updateRoom = async () => {
    addToast('Feature pending backend update', 'info');
    return false;
  };

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

  const addTodo = async (text) => {
    try {
      const newTodo = await todosApi.create(text);
      if (newTodo) {
        setTodos(prev => [...prev, newTodo]);
        addToast('Task added!', 'success');
      }
    } catch (err) {
      console.error('Add todo error:', err);
    }
  };

  const toggleTodo = async (id) => {
    try {
      const updated = await todosApi.toggle(id);
      if (updated) {
        setTodos(todos.map(t => t.id === id ? updated : t));
      }
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

  const addJournalEntry = async (content) => {
    try {
      const userId = currentUser.id || '00000000-0000-0000-0000-000000000000';
      const newEntry = await studyApi.journal.create(userId, content);
      setJournalEntries([newEntry, ...journalEntries]);
      addToast('Reflection saved', 'success');
    } catch (error) { console.error(error); }
  };

  const deleteJournalEntry = (id) => {
    openConfirm({
      title: 'Delete Entry',
      message: 'Sure?',
      onConfirm: async () => {
        try {
          await studyApi.journal.delete(id);
          setJournalEntries(journalEntries.filter(e => e.id !== id));
          addToast('Entry deleted', 'info');
        } catch (error) { console.error(error); }
      },
      type: 'danger'
    });
  };

  const addStudyNote = async (title, content) => {
    try {
      const userId = currentUser.id || '00000000-0000-0000-0000-000000000000';
      const newNote = await studyApi.notes.create(userId, title, content);
      setStudyNotes([newNote, ...studyNotes]);
      addToast('Note saved', 'success');
    } catch (error) { console.error(error); }
  };

  const deleteStudyNote = (id) => {
    openConfirm({
      title: 'Delete Note',
      message: 'Sure?',
      onConfirm: async () => {
        try {
          await studyApi.notes.delete(id);
          setStudyNotes(studyNotes.filter(n => n.id !== id));
          addToast('Note deleted', 'info');
        } catch (error) { console.error(error); }
      },
      type: 'danger'
    });
  };

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

  const resetToHome = () => {
    setView('home');
    resetModals();
    setCurrentRoom(null);
    setIsInRoom(false);
    setHasClosedAuth(true);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center">
        <Sparkles className="text-brand-primary animate-spin-slow" size={48} />
        <h2 className="mt-8 text-xl font-black text-brand-text uppercase tracking-widest">Initializing Crammerly</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen !bg-brand-bg font-sans selection:bg-brand-primary/30 relative flex flex-col">
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

      <main className="flex-1 flex flex-col relative">
        <div className={`max-w-7xl mx-auto w-full px-4 flex-1 flex flex-col ${isInRoom ? 'pt-4 pb-12' : 'py-4'}`}>
          {view === 'home' && (
            <HomeView
              rooms={rooms}
              currentUser={currentUser}
              onCreateRoom={createRoom}
              onRoomClick={room => {
                trackActivity({ id: room.id, title: room.name, type: 'room', genre: room.topic });
                joinRoom(room);
              }}
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

      <ModalPortal>
        {modals.menu && (
          <MenuSidebar
            showMenu={modals.menu}
            setShowMenu={(val) => val ? openModal('menu') : closeModal('menu')}
            userStatus={userStatus}
            setUserStatus={setUserStatus}
            setShowFriendsModal={() => openModal('friends')}
            setShowCalendarModal={() => openModal('calendar')}
            setShowSearchModal={() => openModal('search')}
            setShowBlogsModal={() => openModal('blogsModal')}
            setShowSettingsModal={() => { openModal('settings'); /* handle tab if needed */ }}
            setShowActivityModal={() => openModal('activity')}
            setShowHelpModal={() => openModal('help')}
            setShowBugModal={() => openModal('bug')}
            setShowAboutModal={() => openModal('about')}
            currentUser={currentUser}
            theme={theme}
            setTheme={setTheme}
            handleSignOut={handleAuthLogout}
          />
        )}

        {modals.join && <JoinByCodeModal onClose={resetToHome} onJoin={joinRoomByCode} />}
        {modals.search && <GlobalSearchModal rooms={rooms} onClose={resetToHome} onJoinRoom={joinRoom} />}
        {modals.friends && <FriendsModal currentUser={currentUser} onClose={resetToHome} friendsList={friends} setFriendsList={setFriends} addToast={addToast} />}
        {modals.profile && <ProfileModal currentUser={currentUser} onUpdateProfile={updateUserProfile} onClose={resetToHome} />}
        {modals.auth && <AuthModal onClose={() => { setHasClosedAuth(true); closeModal('auth'); }} onSuccess={() => { setIsInRoom(false); setHasClosedAuth(true); closeModal('auth'); }} />}
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
        {modals.blogsModal && <BlogsModal onClose={resetToHome} />}
        {modals.calendar && <CalendarModal onClose={resetToHome} />}
        {modals.settings && <SettingsModal onClose={resetToHome} />}
        {modals.activity && <ActivityModal onClose={resetToHome} stats={studyStats} />}
        {modals.help && <HelpModal onClose={resetToHome} />}
        {modals.bug && <BugReportModal onClose={resetToHome} />}
        {modals.about && <AboutModal onClose={resetToHome} />}
        {modals.welcome && <WelcomeModal onClose={resetToHome} />}
        {modals.confirm && <ConfirmModal config={modals.confirm} onClose={closeConfirm} />}
      </ModalPortal>
    </div>
  );
}
