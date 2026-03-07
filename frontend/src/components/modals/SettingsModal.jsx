import React, { useState } from 'react';
import { X, Settings, Volume2, ShieldCheck, Lock, Bell, Eye, EyeOff, Trash2, Smartphone, Globe, Shield, CreditCard, Key } from 'lucide-react';

function SettingsModal({ initialTab = 'general', onClose }) {
    const [activeTab, setActiveTab] = useState(initialTab);

    const tabs = [
        { id: 'general', label: 'Basic', icon: <Settings size={18} /> },
        { id: 'voice', label: 'Sound', icon: <Volume2 size={18} /> },
        { id: 'privacy', label: 'Privacy', icon: <ShieldCheck size={18} /> },
        { id: 'security', label: 'Security', icon: <Lock size={18} /> }
    ];

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[32px] w-full max-w-3xl h-full sm:h-[500px] border-0 sm:border border-brand-border/30 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-500 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sidebar */}
                <div className="w-full md:w-56 bg-brand-bg/50 border-b md:border-b-0 md:border-r border-brand-border/20 flex flex-col pt-6 md:pt-8 shrink-0">
                    <div className="px-5 md:px-6 mb-5 md:mb-8 flex items-center justify-between md:block">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-brand-text tracking-tighter uppercase leading-none">Settings</h2>
                            <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mt-1 md:mt-2">Preferences</p>
                        </div>
                        <button onClick={onClose} className="md:hidden p-2 text-brand-text-dim hover:text-brand-text bg-brand-muted/10 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex md:flex-col overflow-x-auto md:overflow-x-visible px-4 pb-4 md:pb-0 md:space-y-1 no-scrollbar shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 md:gap-3.5 px-4 py-2.5 md:py-3.5 rounded-full md:rounded-[20px] transition-all duration-300 group whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-brand-primary text-white shadow-lg md:translate-x-1'
                                    : 'text-brand-text-dim hover:bg-brand-muted/10'
                                    }`}
                            >
                                <span className={`${activeTab === tab.id ? 'text-white' : 'text-brand-muted group-hover:text-brand-primary'} transition-colors shrink-0`}>
                                    {tab.icon}
                                </span>
                                <span className="text-xs md:text-sm font-bold tracking-tight">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="hidden md:block p-8">
                        <div className="bg-brand-primary/10 rounded-2xl p-4 border border-brand-primary/20">
                            <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest leading-relaxed">Changes save automatically.</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col bg-brand-surface relative">
                    <button
                        onClick={onClose}
                        className="hidden md:flex absolute top-6 right-6 p-2 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all z-50 border border-brand-border/30 shadow-md"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 md:p-8 md:pt-14 md:pr-10">
                        {activeTab === 'general' && (
                            <div className="space-y-8 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <h3 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4 md:mb-6">Language</h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-4 bg-brand-bg/30 rounded-2xl border border-brand-border/20 gap-3">
                                            <div className="flex items-center gap-4">
                                                <Globe size={18} className="text-brand-muted shrink-0" />
                                                <span className="text-sm font-bold text-brand-text">Language</span>
                                            </div>
                                            <select className="bg-transparent text-xs font-black text-brand-primary border-none focus:ring-0 cursor-pointer uppercase tracking-widest p-0">
                                                <option>English (US)</option>
                                                <option>Spanish</option>
                                                <option>French</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4 md:mb-6">History</h3>
                                    <div className="p-4 bg-brand-bg/30 rounded-2xl border border-brand-border/20 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <Smartphone size={18} className="text-brand-muted shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-brand-text uppercase tracking-tight truncate">Logged in</p>
                                                <p className="text-[9px] font-medium text-brand-text-dim uppercase tracking-widest mt-0.5 truncate">Chrome • Windows • India</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-brand-success/10 text-brand-success text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-success/20 shrink-0">Active</span>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'voice' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <h3 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-6">Device</h3>
                                    <div className="space-y-4">
                                        <button className="w-full flex items-center justify-between p-4 md:p-5 bg-brand-bg/30 rounded-[20px] md:rounded-3xl border border-brand-border/20 hover:border-brand-primary transition-all text-left">
                                            <span className="text-sm font-bold text-brand-text">Microphone</span>
                                            <span className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-widest text-right ml-2">System Default</span>
                                        </button>
                                        <div className="h-1.5 md:h-2 w-full bg-brand-muted/20 rounded-full overflow-hidden">
                                            <div className="h-full w-[40%] bg-brand-primary animate-pulse shadow-[0_0_10px_rgba(201,181,156,0.5)]"></div>
                                        </div>
                                        <p className="text-[9px] font-medium text-brand-text-dim uppercase tracking-[0.2em] text-center px-4">Speak to test your input sensitivity</p>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <h3 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4 md:mb-6">Privacy</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Study Invites', desc: 'Allow direct room requests.' },
                                            { label: 'Online Status', desc: 'Display your green bubble.' },
                                            { label: 'Direct Messages', desc: 'Allow messages from non-friends.' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 md:p-5 bg-brand-bg/30 rounded-[20px] md:rounded-3xl border border-brand-border/20 gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs md:text-sm font-bold text-brand-text uppercase tracking-tight">{item.label}</p>
                                                    <p className="text-[9px] font-medium text-brand-text-dim mt-1.5 leading-relaxed uppercase tracking-widest line-clamp-2">{item.desc}</p>
                                                </div>
                                                <div className="w-10 h-5 md:w-12 md:h-6 bg-brand-primary rounded-full p-1 cursor-pointer shrink-0">
                                                    <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full ml-auto shadow-sm"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <h3 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4 md:mb-6">Security</h3>
                                    <div className="space-y-3 md:space-y-4">
                                        <button className="w-full flex items-center gap-4 p-4 md:p-5 bg-brand-bg hover:bg-white/50 rounded-[20px] md:rounded-3xl border border-brand-border/30 transition-all text-left">
                                            <div className="w-10 h-10 bg-brand-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                                                <Key size={18} className="md:w-5 md:h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm font-bold text-brand-text uppercase tracking-tight truncate">Change Password</p>
                                                <p className="text-[9px] font-medium text-brand-text-dim mt-1 uppercase tracking-widest truncate">Updated 4 months ago</p>
                                            </div>
                                        </button>
                                        <button className="w-full flex items-center gap-4 p-4 md:p-5 bg-brand-bg hover:bg-white/50 rounded-[20px] md:rounded-3xl border border-brand-border/30 transition-all text-left">
                                            <div className="w-10 h-10 bg-brand-muted/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brand-muted shrink-0">
                                                <Shield size={18} className="md:w-5 md:h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-sm font-bold text-brand-text uppercase tracking-tight truncate">2-Factor Auth</p>
                                                <p className="text-[9px] font-medium text-brand-primary mt-1 uppercase tracking-widest truncate">Recommended</p>
                                            </div>
                                        </button>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsModal;
