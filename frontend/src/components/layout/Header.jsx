import React from 'react';
import { Bell, Lightbulb, Calendar as CalendarIcon, ChevronLeft, LogOut, UserPlus } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';

const Header = ({
    isInRoom,
    leaveRoom,
    modals,
    toggleModal,
    openModal,
    unreadCount,
    unreadMessagesCount,
    currentUser,
    theme,
    toggleTheme
}) => {
    return (
        <header className={`sticky top-0 z-[110] w-full bg-brand-surface border-b border-brand-border/20 shadow-sm opacity-100 transition-all ${(modals.profile || modals.friends || modals.calendar) ? 'hidden' : modals.floating ? 'hidden sm:block' : 'block'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 relative z-10 !bg-brand-surface">
                {/* Left Actions */}
                <div className="flex items-center gap-1 md:gap-3 flex-1">
                    {isInRoom ? (
                        <button
                            onClick={leaveRoom}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-2xl transition-all font-black"
                            title="Back to Home"
                        >
                            <ChevronLeft size={24} strokeWidth={3} />
                        </button>
                    ) : (
                        <button
                            onClick={() => toggleModal('menu')}
                            className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/20 rounded-2xl transition-all text-xl md:text-2xl"
                            title="Menu"
                        >
                            ☰
                            {unreadMessagesCount > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-danger rounded-full border-2 border-brand-surface animate-pulse"></span>
                            )}
                        </button>
                    )}

                    <button
                        onClick={() => openModal('friends')}
                        className="relative flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 items-center justify-center text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/20 rounded-xl sm:rounded-2xl transition-all"
                        title="Friends"
                    >
                        <UserPlus size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                        {unreadMessagesCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-brand-danger border-2 border-brand-surface rounded-full flex items-center justify-center text-[6px] sm:text-[8px] font-black text-white shadow-lg animate-pulse">
                                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => openModal('calendar')}
                        className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 items-center justify-center text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/20 rounded-xl sm:rounded-2xl transition-all"
                        title="Calendar"
                    >
                        <CalendarIcon size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Center Brand */}
                <div className="flex-[2] flex flex-col items-center justify-center text-center">
                    <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-[1000] text-brand-text tracking-tighter uppercase leading-none">CRAMMER<span className="text-brand-primary">LY</span></h1>

                </div>

                {/* Right Actions */}
                <div className="flex items-center justify-end gap-1 md:gap-3 flex-1">
                    <div className="relative hidden md:flex">
                        <button
                            onClick={toggleTheme}
                            className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/10"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <Lightbulb size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => toggleModal('notifications')}
                            className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all ${modals.notifications ? 'text-brand-text bg-brand-muted/10' : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/10'}`}
                            title="Notifications"
                        >
                            <Bell size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 md:top-1.5 md:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-brand-danger border-2 border-brand-surface rounded-full flex items-center justify-center text-[6px] sm:text-[8px] md:text-[9px] font-black text-white shadow-lg z-20">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <button
                        onClick={() => openModal('profile')}
                        className="p-0.5 md:p-1 rounded-full transition-all active:scale-90"
                        title={currentUser?.name || 'Profile'}
                    >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-brand-muted/20 border-2 border-brand-border/30 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-black text-brand-text shadow-sm overflow-hidden">
                            {currentUser?.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (currentUser?.name || currentUser?.username || '?')[0].toUpperCase()
                            )}
                        </div>
                    </button>

                    {isInRoom && (
                        <button
                            onClick={leaveRoom}
                            className="hidden xs:flex w-10 h-10 md:w-12 md:h-12 items-center justify-center bg-brand-muted/10 hover:bg-brand-muted/20 text-brand-text-dim rounded-2xl transition-all border border-brand-border/20"
                            title="Leave Room"
                        >
                            <LogOut size={18} className="md:w-5 md:h-5" />
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
