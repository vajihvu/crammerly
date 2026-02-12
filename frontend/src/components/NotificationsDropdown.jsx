// src/components/NotificationsDropdown.jsx
import React from 'react';
import { X, Bell, BellRing } from 'lucide-react';

import { getTimeAgo } from './utils/helpers';

function NotificationsDropdown({ notifications, setShowNotifications, clearAllNotifications, markNotificationAsRead, isPortal }) {
  return (
    <>
      {isPortal && (
        <div
          className="fixed inset-0 bg-transparent z-[99999]"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}
      <div
        className={`${isPortal ? 'fixed right-4 sm:right-10 top-20' : 'fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-20 sm:top-[calc(100%+8px)]'} w-auto sm:w-96 !bg-brand-surface rounded-[28px] border border-brand-border shadow-dropdown max-h-[calc(100vh-120px)] sm:max-h-[500px] overflow-hidden flex flex-col z-[100000] animate-in fade-in zoom-in-95 duration-300 font-sans`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="p-5 border-b border-brand-border flex items-center justify-between !bg-brand-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary/10 flex items-center justify-center rounded-lg border border-brand-primary/20">
              <BellRing size={16} className="text-brand-primary" />
            </div>
            <h3 className="font-black text-brand-text text-sm uppercase tracking-widest leading-none mt-0.5">Alerts</h3>
          </div>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <button onClick={clearAllNotifications} className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim hover:text-brand-primary transition-colors">
                Clear all
              </button>
            )}
            <button onClick={() => setShowNotifications(false)} className="p-1.5 text-brand-text-dim hover:text-brand-text hover:bg-brand-bg rounded-full transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-border">
                <Bell size={32} className="text-brand-muted" />
              </div>
              <p className="text-[11px] font-black text-brand-text-dim uppercase tracking-[0.2em]">All Caught Up</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => markNotificationAsRead(notif.id)}
                  className={`w-full text-left p-4 transition-all rounded-[20px] border relative group ${notif.read
                    ? 'bg-brand-surface border-brand-border/30 hover:bg-brand-bg opacity-70'
                    : 'bg-brand-card border-brand-primary/40 shadow-sm'
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.read ? 'bg-brand-muted' : 'bg-brand-primary animate-pulse'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-relaxed ${notif.read ? 'text-brand-text-dim font-medium' : 'text-brand-text font-bold'}`}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mt-2 px-1">
                        {getTimeAgo(notif.time)}
                      </p>
                    </div>
                    <div className="text-lg flex-shrink-0 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      {notif.type === 'room_invite' && '🏠'}
                      {notif.type === 'progress' && '✅'}
                      {notif.type === 'friend' && '👥'}
                      {notif.type === 'achievement' && '🏆'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default NotificationsDropdown;