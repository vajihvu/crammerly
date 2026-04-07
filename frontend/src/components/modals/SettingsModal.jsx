import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Settings, Volume2, ShieldCheck, Lock, Bell, Eye, EyeOff, Trash2, Smartphone, Globe, Shield, CreditCard, Key, CheckCircle, Monitor, QrCode } from 'lucide-react';
import { sessionsApi, authApi } from '../../api';
import { usersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

function SettingsModal({ initialTab = 'general', onClose }) {
    const { user: authData, updateUser } = useAuth();
    const currentUser = authData?.user || authData; // Failsafe for structure variations
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(currentUser?.settings?.language || 'ENGLISH (US)');
    
    // Interactive states — initialize from persisted user settings
    const [privacy, setPrivacy] = useState({
        invites: true,
        online: true,
        dms: false
    });

    // Initialize privacy settings when currentUser is available
    useEffect(() => {
        if (currentUser?.settings?.privacy) {
            setPrivacy({
                invites: currentUser.settings.privacy.allowInvites ?? true,
                online: currentUser.settings.privacy.showOnlineStatus ?? true,
                dms: currentUser.settings.privacy.allowDMs ?? false
            });
        }
    }, [currentUser?.settings?.privacy]);
    const [micLevel, setMicLevel] = useState(0);
    
    // Track if initial load is done to avoid saving on mount
    const isInitialMount = useRef(true);

    // Auto-save privacy settings when toggled
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const saveSettings = async () => {
            try {
                const response = await usersApi.updateProfile({
                    settings: {
                        privacy: {
                            allowInvites: privacy.invites,
                            showOnlineStatus: privacy.online,
                            allowDMs: privacy.dms
                        }
                    }
                });
                if (response.success) {
                    updateUser(response.data);
                }
            } catch (err) {
                console.error('Failed to save privacy settings:', err);
            }
        };
        saveSettings();
    }, [privacy, updateUser]);

    // Auto-save language when changed
    const handleLanguageChange = useCallback(async (lang) => {
        setSelectedLanguage(lang);
        setIsLanguageOpen(false);
        try {
            const response = await usersApi.updateProfile({
                settings: { language: lang }
            });
            if (response.success) {
                updateUser(response.data);
            }
        } catch (err) {
            console.error('Failed to save language setting:', err);
        }
    }, [updateUser]);


    const [isTestingMic, setIsTestingMic] = useState(false);
    
    // Password State
    const [isChangingPwd, setIsChangingPwd] = useState(false);
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '' });
    const [pwdStatus, setPwdStatus] = useState(''); // '', 'loading', 'success', 'error'
    const [pwdError, setPwdError] = useState('');

    const handleChangePassword = async () => {
        if (!pwdData.currentPassword || !pwdData.newPassword) {
            setPwdError('Please fill all fields');
            return;
        }
        setPwdStatus('loading');
        setPwdError('');
        try {
            await authApi.changePassword(pwdData.currentPassword, pwdData.newPassword);
            setPwdStatus('success');
            setTimeout(() => {
                setIsChangingPwd(false);
                setPwdStatus('');
                setPwdData({ currentPassword: '', newPassword: '' });
            }, 3000);
        } catch (err) {
            setPwdStatus('error');
            setPwdError(err.response?.data?.message || err.message || 'Failed to change password');
        }
    };
    
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    useEffect(() => {
        if (activeTab === 'security' || activeTab === 'general') {
            loadSessions();
        }
    }, [activeTab]);

    const loadSessions = async () => {
        setLoadingSessions(true);
        try {
            const data = await sessionsApi.getAll();
            setSessions(data);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        try {
            const success = await sessionsApi.revoke(sessionId);
            if (success) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
            }
        } catch (err) {
            console.error('Failed to revoke session:', err);
        }
    };

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const animationFrameRef = useRef(null);
    
    const togglePrivacy = (key) => setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));

    const startMicTest = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            microphone.connect(analyser);
            
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            microphoneRef.current = microphone;
            
            setIsTestingMic(true);

            const updateMicLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / bufferLength;
                    const percentage = Math.min(100, Math.round((average / 128) * 100));
                    setMicLevel(percentage);
                    animationFrameRef.current = requestAnimationFrame(updateMicLevel);
                }
            };
            
            updateMicLevel();
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const stopMicTest = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (microphoneRef.current) {
            microphoneRef.current.mediaStream.getTracks().forEach(track => track.stop());
            microphoneRef.current.disconnect();
        }
        if (audioContextRef.current) audioContextRef.current.close();
        setIsTestingMic(false);
        setMicLevel(0);
    };

    useEffect(() => {
        if (activeTab !== 'voice') {
            stopMicTest();
        }
        return () => stopMicTest(); // Cleanup
    }, [activeTab]);

    const languages = ['ENGLISH (US)', 'SPANISH', 'FRENCH'];

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
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                                    className="flex items-center gap-2 bg-transparent text-xs font-black text-brand-primary/80 hover:text-brand-primary border-none uppercase tracking-widest transition-colors"
                                                >
                                                    {selectedLanguage}
                                                    <span className="text-[10px]">▼</span>
                                                </button>
                                                
                                                {isLanguageOpen && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setIsLanguageOpen(false)}></div>
                                                        <div className="absolute right-0 top-full mt-2 w-36 bg-brand-surface border border-brand-border/40 shadow-dropdown z-50 font-sans border-t-0 -translate-y-1">
                                                            {languages.map(lang => (
                                                                <button
                                                                    key={lang}
                                                                    onClick={() => handleLanguageChange(lang)}
                                                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                                                                        selectedLanguage === lang 
                                                                        ? 'bg-[#1d4ed8] text-white' 
                                                                        : 'text-brand-text-dim hover:text-brand-primary hover:bg-brand-bg/50'
                                                                    }`}
                                                                >
                                                                    {lang}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4 md:mb-6">History</h3>
                                    {loadingSessions ? (
                                        <div className="flex items-center justify-center py-6">
                                            <div className="w-6 h-6 border-3 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                                        </div>
                                    ) : (() => {
                                        const currentSession = (sessions || []).find(s => s.isCurrent);
                                        return currentSession ? (
                                            <div className="p-4 bg-brand-bg/30 rounded-2xl border border-brand-border/20 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <Monitor size={18} className="text-brand-muted shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-brand-text uppercase tracking-tight truncate">{currentSession.deviceName || 'Logged in'}</p>
                                                        <p className="text-[9px] font-medium text-brand-text-dim uppercase tracking-widest mt-0.5 truncate">{currentSession.userAgent ? currentSession.userAgent.substring(0, 50) : 'Unknown device'} {currentSession.ipAddress ? `• ${currentSession.ipAddress}` : ''}</p>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 bg-brand-success/10 text-brand-success text-[9px] font-black uppercase tracking-widest rounded-full border border-brand-success/20 shrink-0">Active</span>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-brand-bg/30 rounded-2xl border border-brand-border/20 text-center">
                                                <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">No session data available.</p>
                                            </div>
                                        );
                                    })()}
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
                                        <div className="h-1.5 md:h-2 w-full bg-brand-muted/20 rounded-full overflow-hidden relative">
                                            <div 
                                                className="h-full bg-brand-primary transition-all duration-75 shadow-[0_0_10px_rgba(201,181,156,0.5)]" 
                                                style={{ width: `${isTestingMic ? micLevel : 0}%` }}
                                            ></div>
                                        </div>
                                        {isTestingMic ? (
                                            <button onClick={stopMicTest} className="w-full text-[9px] font-medium text-brand-danger uppercase tracking-[0.2em] text-center px-4 hover:underline">Stop Mic Test</button>
                                        ) : (
                                            <button onClick={startMicTest} className="w-full text-[9px] font-medium text-brand-text-dim uppercase tracking-[0.2em] text-center px-4 hover:text-brand-primary transition-colors">Start Mic Test</button>
                                        )}
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
                                            { id: 'invites', label: 'Study Invites', desc: 'Allow direct room requests.' },
                                            { id: 'online', label: 'Online Status', desc: 'Display your green bubble.' },
                                            { id: 'dms', label: 'Direct Messages', desc: 'Allow messages from non-friends.' }
                                        ].map((item) => (
                                            <div key={item.id} onClick={() => togglePrivacy(item.id)} className="flex items-center justify-between p-4 md:p-5 bg-brand-bg/30 rounded-[20px] md:rounded-3xl border border-brand-border/20 gap-4 cursor-pointer hover:border-brand-primary/30 transition-colors">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs md:text-sm font-bold text-brand-text uppercase tracking-tight">{item.label}</p>
                                                    <p className="text-[9px] font-medium text-brand-text-dim mt-1.5 leading-relaxed uppercase tracking-widest line-clamp-2">{item.desc}</p>
                                                </div>
                                                <div className={`w-10 h-5 md:w-12 md:h-6 rounded-full p-1 shrink-0 transition-colors duration-300 relative border ${privacy[item.id] ? 'bg-brand-primary border-brand-primary' : 'bg-brand-muted/30 border-brand-border/60'}`}>
                                                    <div className={`w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-sm absolute top-[1px] md:top-0.5 transition-all duration-300 ${privacy[item.id] ? 'translate-x-[20px] md:translate-x-[22px]' : 'translate-x-0'}`}></div>
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
                                        {!isChangingPwd ? (
                                            <button onClick={() => setIsChangingPwd(true)} className="w-full flex items-center gap-4 p-4 md:p-5 bg-brand-bg hover:bg-white/50 rounded-[20px] md:rounded-3xl border border-brand-border/30 transition-all text-left">
                                                <div className="w-10 h-10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-colors bg-brand-primary/10 text-brand-primary">
                                                    <Key size={18} className="md:w-5 md:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs md:text-sm font-bold text-brand-text uppercase tracking-tight truncate">Change Password</p>
                                                    <p className="text-[9px] font-medium mt-1 uppercase tracking-widest truncate transition-colors text-brand-text-dim">Update your security key</p>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="p-4 md:p-5 bg-brand-bg/50 rounded-[20px] md:rounded-3xl border border-brand-primary/30 space-y-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-primary/10 text-brand-primary shrink-0">
                                                        <Key size={14} />
                                                    </div>
                                                    <h4 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">Update Password</h4>
                                                </div>
                                                <input 
                                                    type="password" 
                                                    placeholder="Current Password" 
                                                    value={pwdData.currentPassword}
                                                    onChange={e => setPwdData({...pwdData, currentPassword: e.target.value})}
                                                    disabled={pwdStatus === 'loading' || pwdStatus === 'success'}
                                                    className="w-full px-4 py-3 bg-brand-surface rounded-xl border border-brand-border/50 text-brand-text text-sm focus:outline-none focus:border-brand-primary transition-colors"
                                                />
                                                <input 
                                                    type="password" 
                                                    placeholder="New Password" 
                                                    value={pwdData.newPassword}
                                                    onChange={e => setPwdData({...pwdData, newPassword: e.target.value})}
                                                    disabled={pwdStatus === 'loading' || pwdStatus === 'success'}
                                                    className="w-full px-4 py-3 bg-brand-surface rounded-xl border border-brand-border/50 text-brand-text text-sm focus:outline-none focus:border-brand-primary transition-colors"
                                                />
                                                {pwdError && <p className="text-[10px] font-bold text-brand-danger uppercase tracking-widest">{pwdError}</p>}
                                                {pwdStatus === 'success' && <p className="text-[10px] font-bold text-brand-success uppercase tracking-widest flex items-center gap-2"><CheckCircle size={12}/> Password Updated Successfully</p>}
                                                
                                                <div className="flex gap-3 pt-2">
                                                    <button 
                                                        onClick={handleChangePassword} 
                                                        disabled={pwdStatus === 'loading' || pwdStatus === 'success'}
                                                        className="flex-1 py-3 bg-brand-primary text-brand-bg rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-primary/90 transition-all flex items-center justify-center"
                                                    >
                                                        {pwdStatus === 'loading' ? <div className="w-4 h-4 border-2 border-brand-bg/30 border-t-brand-bg rounded-full animate-spin"/> : 'Confirm Change'}
                                                    </button>
                                                    <button 
                                                        onClick={() => { setIsChangingPwd(false); setPwdError(''); setPwdStatus(''); setPwdData({currentPassword:'', newPassword:''}); }}
                                                        disabled={pwdStatus === 'loading'}
                                                        className="px-6 py-3 bg-brand-surface border border-brand-border/50 text-brand-text-dim hover:text-brand-text rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-[10px] md:text-xs font-black text-brand-primary uppercase tracking-[0.2em] mb-4 md:mb-6">Device History</h3>
                                    <div className="space-y-4">
                                        {loadingSessions ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                                                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                                            </div>
                                        ) : (sessions || []).length === 0 ? (
                                            <div className="text-center py-8">
                                                <p className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest">No active sessions.</p>
                                            </div>
                                        ) : (
                                            (sessions || []).map((session) => (
                                                <div key={session.id} className="p-4 rounded-[20px] md:rounded-3xl border border-brand-border/40 bg-brand-bg/50 flex flex-col xs:flex-row items-start xs:items-center gap-4 transition-all hover:border-brand-primary/30 group">
                                                    <div className="w-10 h-10 bg-brand-surface rounded-xl flex items-center justify-center border border-brand-border/60 shrink-0">
                                                        {session.userAgent?.toLowerCase().includes('windows') || session.userAgent?.toLowerCase().includes('mac') ? (
                                                            <Monitor size={18} className="text-brand-text-dim group-hover:text-brand-primary transition-colors" />
                                                        ) : (
                                                            <Globe size={18} className="text-brand-text-dim group-hover:text-brand-primary transition-colors" />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h5 className="text-xs font-black text-brand-text uppercase truncate">
                                                                {session.deviceName || 'Unknown Browser'}
                                                            </h5>
                                                            {session.isCurrent && (
                                                                <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest rounded border border-brand-primary/20">
                                                                    This Device
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-brand-text-dim uppercase tracking-widest opacity-60">
                                                            <span>{session.ipAddress || 'IP Hidden'}</span>
                                                            <span className="w-1 h-1 bg-brand-border rounded-full" />
                                                            <span>Last used {new Date(session.lastUsedAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>

                                                    {!session.isCurrent && (
                                                        <button
                                                            onClick={() => handleRevokeSession(session.id)}
                                                            className="p-2 text-brand-text-dim hover:text-brand-danger hover:bg-brand-danger/10 rounded-lg transition-all active:scale-95"
                                                            title="Revoke session"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
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
