// src/components/MenuSidebar.jsx
import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Settings,
  BarChart3,
  User,
  Paintbrush,
  Volume2,
  ShieldCheck,
  Lock,
  HelpCircle,
  AlertCircle,
  Info,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Search,
  Users,
  Calendar as CalendarIcon,
  BookOpen
} from 'lucide-react';

function MenuButton({ icon, label, onClick, variant = 'default', expanded = false, hasSubmenu = false }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 ${variant === 'danger'
        ? 'hover:bg-brand-danger/20 text-brand-danger hover:text-white'
        : 'hover:bg-brand-muted/20 text-brand-text-dim hover:text-brand-text'
        } ${expanded ? 'bg-brand-muted/10' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`transition-transform duration-200 group-hover:scale-110 ${variant === 'danger' ? 'text-brand-danger' : 'text-brand-muted group-hover:text-brand-primary'}`}>
          {icon}
        </div>
        <span className="text-[13px] font-medium tracking-tight whitespace-nowrap">{label}</span>
      </div>
      {hasSubmenu ? (
        <ChevronDown size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''} text-brand-muted`} />
      ) : (
        <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-all -translate-x-1 group-hover:translate-x-0" />
      )}
    </button>
  );
}

function MenuSidebar({
  setShowMenu,
  userStatus,
  setUserStatus,
  setShowCalendarModal,
  setShowSettingsModal,
  setShowHelpModal,
  setShowBugModal,
  setShowAboutModal,
  setShowFriendsModal,
  setShowSearchModal,
  currentUser,
  theme,
  setTheme,
  handleSignOut
}) {
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [pendingTheme, setPendingTheme] = useState(theme);
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);
  const [showDndTimePicker, setShowDndTimePicker] = useState(false);

  const statusOptions = [
    { status: 'online', label: 'Online', color: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/15', pulse: true },
    { status: 'busy', label: 'Do Not Disturb', color: 'bg-rose-500', text: 'text-rose-500', bg: 'bg-rose-500/15' },
    { status: 'offline', label: 'Offline', color: 'bg-brand-muted', text: 'text-brand-text-dim', bg: 'bg-brand-muted/15' }
  ];

  const activeStatus = statusOptions.find(opt => opt.status === userStatus) || statusOptions[0];

  const modeOptions = [
    { id: 'light', label: 'Standard Mode', desc: 'Classic light interface', icon: <Sun size={20} /> },
    { id: 'dark', label: 'Dark Mode', desc: 'Easy on the eyes', icon: <Moon size={20} /> }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100000] animate-in fade-in duration-300"
        onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
      ></div>

      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 h-full w-[240px] sm:w-[280px] bg-brand-surface border-r border-brand-border shadow-2xl z-[100001] overflow-y-auto custom-scrollbar animate-in slide-in-from-left duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* User Profile Header */}
        <div className="p-4 pb-2 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-3">
            <button onClick={() => setShowMenu(false)} className="p-2 text-brand-text-dim hover:text-brand-text hover:bg-white/5 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="w-14 h-14 bg-brand-muted rounded-full flex items-center justify-center text-xl font-black text-brand-text shadow-xl border-2 border-brand-surface overflow-hidden">
              {currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (currentUser?.name || '?')[0].toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-text tracking-tight">{currentUser?.name || 'Anonymous'}</h3>
              <p className="text-xs text-brand-text-dim font-medium lowercase">@{currentUser?.username || 'user'}#{currentUser?.tag || '0000'}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-2 py-2">
          {/* Status Section (Single Feature) */}
          <div className="mb-2">
            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</div>
            <div className="space-y-1">
              {/* Main status button */}
              <button
                onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-300 ${isStatusExpanded
                  ? 'bg-brand-muted/30 border border-brand-primary/40'
                  : 'bg-brand-muted/20 border border-brand-border/30 hover:bg-brand-muted/30'
                  }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${activeStatus.color} ${activeStatus.pulse ? 'animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : ''}`}></div>
                <span className={`text-[14px] font-bold ${activeStatus.text}`}>{activeStatus.label}</span>
                <ChevronDown size={16} className={`ml-auto text-slate-500 transition-transform duration-300 ${isStatusExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Collapsible status options */}
              <div className={`overflow-hidden transition-all duration-300 ${isStatusExpanded ? 'max-h-[300px] mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-brand-surface rounded-xl border border-brand-border/10 p-1.5 space-y-1 relative">
                  {!showDndTimePicker ? (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                      {statusOptions.map((item) => (
                        <button
                          key={item.status}
                          onClick={() => {
                            if (item.status === 'busy') {
                              setShowDndTimePicker(true);
                            } else {
                              setUserStatus(item.status);
                              setIsStatusExpanded(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${userStatus === item.status
                            ? `${item.bg} ${item.text}`
                            : 'text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/10'
                            }`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${item.color} ${item.status === 'online' && userStatus === 'online' ? 'animate-pulse' : ''}`}></div>
                          <span className="text-[13px] font-bold">{item.label}</span>
                          {userStatus === item.status && <CheckCircle size={14} className="ml-auto opacity-70" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Select Duration</span>
                        <button
                          onClick={() => setShowDndTimePicker(false)}
                          className="text-[10px] font-black text-brand-text-dim hover:text-brand-text uppercase tracking-widest"
                        >
                          Back
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['15 mins', '30 mins', '45 mins', '1 hour'].map((time) => (
                          <button
                            key={time}
                            onClick={() => {
                              setUserStatus('busy');
                              setShowDndTimePicker(false);
                              setIsStatusExpanded(false);
                              console.log(`DND set for: ${time}`);
                            }}
                            className="px-3 py-2.5 bg-brand-muted/20 border border-brand-border/30 hover:border-brand-primary hover:bg-brand-primary/10 rounded-xl text-[11px] font-bold text-brand-text transition-all text-center"
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Actions */}
          <div className="space-y-1 mb-2">
            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Platform</div>
            <div className="sm:hidden space-y-1">
              <MenuButton icon={<CalendarIcon size={20} />} label="Study Calendar" onClick={() => { setShowMenu(false); setShowCalendarModal(); }} />
              <div className="h-px bg-white/5 mx-3 my-2"></div>
            </div>
            <div className="md:hidden space-y-1">
              <MenuButton icon={<Search size={20} />} label="Find Rooms" onClick={() => { setShowMenu(false); setShowSearchModal(); }} />
              <MenuButton icon={<Users size={20} />} label="Friends" onClick={() => { setShowMenu(false); setShowFriendsModal(); }} />
            </div>
            <MenuButton icon={<Settings size={20} />} label="Settings" onClick={() => { setShowMenu(false); setShowSettingsModal(); }} />
            <div className="md:hidden">
              <MenuButton
                icon={<Paintbrush size={20} />}
                label="Appearance"
                onClick={() => { setPendingTheme(theme); setShowAppearanceModal(true); }}
              />
            </div>
          </div>

          <div className="h-px bg-brand-border/10 mx-3 mb-4"></div>

          {/* Additional Info */}
          <div className="space-y-1 mb-6">
            <div className="px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Support</div>
            <MenuButton icon={<HelpCircle size={20} />} label="Help Center" onClick={() => { setShowMenu(false); setShowHelpModal(true); }} />
            <MenuButton icon={<AlertCircle size={20} />} label="Report a Bug" onClick={() => { setShowMenu(false); setShowBugModal(true); }} />
            <MenuButton icon={<Info size={20} />} label="About Platform" onClick={() => { setShowMenu(false); setShowAboutModal(true); }} />
          </div>
        </div>

        {/* Footer Logout */}
        <div className="p-4 bg-brand-surface border-t border-brand-border shrink-0">
          <MenuButton
            icon={<LogOut size={20} />}
            label="Sign Out"
            variant="danger"
            onClick={() => { setShowMenu(false); handleSignOut(); }}
          />
        </div>
      </div>

      {/* Switch Modes Modal */}
      {showAppearanceModal && (
        <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4" onClick={() => setShowAppearanceModal(false)}>
          <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-2xl w-full max-w-[320px] overflow-hidden animate-in zoom-in-95 fade-in duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <Paintbrush size={18} className="text-brand-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-text uppercase tracking-tight">Switch Modes</h3>
                  <p className="text-[10px] text-brand-text-dim font-medium">Choose your preferred interface</p>
                </div>
              </div>
            </div>

            {/* Mode Options */}
            <div className="px-5 space-y-2">
              {modeOptions.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setPendingTheme(mode.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                    pendingTheme === mode.id
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-brand-border/30 bg-brand-bg/50 hover:border-brand-primary/40'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    pendingTheme === mode.id ? 'bg-brand-primary text-white' : 'bg-brand-muted/20 text-brand-muted'
                  }`}>
                    {mode.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-brand-text">{mode.label}</p>
                    <p className="text-[10px] text-brand-text-dim font-medium">{mode.desc}</p>
                  </div>
                  {pendingTheme === mode.id && (
                    <CheckCircle size={18} className="text-brand-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="px-5 pt-4 pb-5 flex gap-3">
              <button
                onClick={() => setShowAppearanceModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-brand-border/50 text-brand-text-dim hover:text-brand-text text-[11px] font-black uppercase tracking-widest transition-all hover:bg-brand-muted/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setTheme(pendingTheme);
                  setShowAppearanceModal(false);
                }}
                disabled={pendingTheme === theme}
                className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                  pendingTheme === theme
                    ? 'bg-brand-muted/20 text-brand-text-dim cursor-not-allowed'
                    : 'bg-brand-primary text-white hover:bg-brand-primary/90 shadow-lg'
                }`}
              >
                Switch Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MenuSidebar;
