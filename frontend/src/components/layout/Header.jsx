import React from 'react';
import { Bell, BookOpen, Calendar as CalendarIcon, ChevronLeft, LogOut, UserPlus } from 'lucide-react';
import NotificationsDropdown from '../NotificationsDropdown';

const Header = ({
    isInRoom,
    leaveRoom,
    modals,
    toggleModal,
    openModal,
    closeModal,
    unreadCount,
    currentUser
}) => {
    return (
        <header className={`sticky top-0 z-[110] w-full bg-brand-surface border-b border-brand-border/20 shadow-sm opacity-100 transition-all ${(modals.profile || modals.friends || modals.calendar || modals.blogsModal) ? 'hidden' : modals.floating ? 'hidden sm:block' : 'block'}`}>
            <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-4 relative z-10 !bg-brand-surface">
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
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/20 rounded-2xl transition-all text-xl md:text-2xl"
                            title="Menu"
                        >
                            ☰
                        </button>
                    )}

                    <button
                        onClick={() => openModal('friends')}
                        className="flex w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 items-center justify-center text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/20 rounded-xl sm:rounded-2xl transition-all"
                        title="Friends"
                    >
                        <UserPlus size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
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
                            onClick={() => toggleModal('blogsDropdown')}
                            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all ${modals.blogsDropdown ? 'text-brand-text bg-brand-muted/10' : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/10'}`}
                            title="Explore Blogs"
                        >
                            <BookOpen size={16} className="sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                        </button>

                        {modals.blogsDropdown && (
                            <>
                                <div className="fixed inset-0 z-[90]" onClick={() => closeModal('blogsDropdown')}></div>
                                <div className="absolute right-0 mt-4 w-[280px] xs:w-[320px] sm:w-[340px] !bg-brand-surface rounded-[24px] border border-brand-border shadow-dropdown z-[9999] p-6 animate-in fade-in zoom-in-95 duration-200 font-sans" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1 h-6 bg-brand-primary rounded-full"></div>
                                        <h3 className="text-lg font-black text-brand-text tracking-tight uppercase font-sans">Explore Blogs</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {(currentUser?.interests?.length > 0 && currentUser?.skills?.length > 0) ? (
                                            [
                                                { title: 'Top 10 Data Structures Hacks', author: 'FOCUS MASTER', time: '5 MIN READ' },
                                                { title: 'Future of Algorithms', author: 'TECH INSIDER', time: '8 MIN READ' }
                                            ].map((blog, i) => (
                                                <div key={i} onClick={() => openModal('blogsModal')} className="group cursor-pointer bg-brand-bg hover:bg-brand-muted/10 p-4 rounded-2xl border border-brand-border hover:border-brand-primary transition-all relative overflow-hidden text-left">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary opacity-0 group-hover:opacity-100 transition-all"></div>
                                                    <h4 className="text-sm font-bold text-brand-text mb-2 leading-tight group-hover:text-brand-primary transition-colors font-sans">{blog.title}</h4>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-medium text-brand-text-dim uppercase tracking-widest font-sans">{blog.author}</span>
                                                        <span className="text-[10px] font-medium text-brand-primary uppercase tracking-widest font-sans">{blog.time}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 px-4 bg-brand-bg rounded-2xl border border-brand-border/30">
                                                <span className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest">Profile Required</span>
                                                <p className="mt-2 text-xs font-bold text-brand-text-dim/80 leading-relaxed">Update your interests and skills in your Profile to unlock personalized blog recommendations!</p>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => openModal('blogsModal')} className="w-full mt-6 py-3.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-brand-primary/30 transition-all active:scale-95 shadow-lg font-sans">View All Blogs</button>
                                </div>
                            </>
                        )}
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
                        title={currentUser.name}
                    >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 bg-brand-muted/20 border-2 border-brand-border/30 rounded-full flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-black text-brand-text shadow-sm overflow-hidden">
                            {currentUser.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (currentUser.name || '?')[0].toUpperCase()
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
