import React, { useState, useEffect } from 'react';
import { X, Info, Globe, Twitter, Github, Heart, Code2 } from 'lucide-react';
import { statsApi } from '../../api';
import { getSocket } from '../../utils/socket';

function AboutModal({ onClose }) {
    const [stats, setStats] = useState({ 
        activeUsers: 1402391, 
        countries: '180+',
        totalUsers: 0 
    });
    
    useEffect(() => {
        // 1. Fetch initial public stats
        const fetchInitialStats = async () => {
            try {
                const res = await statsApi.getPublicStats();
                if (res.success) {
                    setStats(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchInitialStats();

        // 2. Listen for real-time socket updates
        const socket = getSocket();
        if (socket) {
            const handleStatsUpdate = (data) => {
                setStats(prev => ({
                    ...prev,
                    activeUsers: data.activeUsers
                }));
            };
            socket.on('stats_update', handleStatsUpdate);
            return () => socket.off('stats_update', handleStatsUpdate);
        }
    }, []);

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[32px] w-full max-w-sm h-full sm:h-auto border-0 sm:border border-brand-border/30 shadow-2xl p-6 md:p-8 animate-in zoom-in-95 duration-500 relative flex flex-col items-center justify-center overflow-hidden font-sans text-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-5 right-5 z-20">
                    <button onClick={onClose} className="p-2 text-brand-text-dim hover:text-brand-text bg-brand-muted/10 md:bg-transparent hover:bg-brand-muted/20 rounded-full transition-all">
                        <X size={18} />
                    </button>
                </div>

                <div className="mb-6 md:mb-8 pt-2">
                    <h1 className="text-2xl md:text-3xl font-[1000] text-brand-text tracking-tighter uppercase leading-none mb-3">CRAMMERL<span className="text-brand-primary">Y</span></h1>
                    <div className="inline-block px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">

                        <p className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase tracking-[0.4em]">PRO VERSION 1.2.0</p>
                    </div>
                </div>

                <p className="text-[11px] md:text-[12px] font-medium text-brand-text leading-relaxed mb-6 md:mb-8 px-2">
                    Empowering the next generation of lifelong learners through real-time collaborative focus environments and AI-driven study assistance.
                </p>

                <div className="grid grid-cols-2 gap-2 mb-6 md:mb-8 w-full">
                    <div className="p-3 bg-brand-bg/40 rounded-[20px] border border-brand-border/20">
                        <p className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse shadow-[0_0_8px_rgba(201,181,156,0.6)]"></span> Users Active</p>
                        <p className="text-md md:text-lg font-[1000] text-brand-text tracking-tighter flex items-center justify-center gap-1">{stats.activeUsers.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-brand-bg/40 rounded-[20px] border border-brand-border/20">
                        <p className="text-[8px] md:text-[9px] font-black text-brand-primary uppercase tracking-widest mb-0.5">Countries</p>
                        <p className="text-md md:text-lg font-[1000] text-brand-text tracking-tighter">{stats.countries}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-6 md:mb-8">
                    <div className="flex items-center justify-center gap-3">
                        <button className="p-2.5 bg-brand-bg rounded-xl border border-brand-border/30 text-brand-text-dim hover:text-brand-primary hover:border-brand-primary transition-all active:scale-90"><Globe size={16} /></button>
                        <button className="p-2.5 bg-brand-bg rounded-xl border border-brand-border/30 text-brand-text-dim hover:text-brand-primary hover:border-brand-primary transition-all active:scale-90"><Twitter size={16} /></button>
                        <button className="p-2.5 bg-brand-bg rounded-xl border border-brand-border/30 text-brand-text-dim hover:text-brand-primary hover:border-brand-primary transition-all active:scale-90"><Github size={16} /></button>
                    </div>
                </div>

                <div className="pt-6 border-t border-brand-border/20 w-full">
                    <div className="flex items-center justify-center gap-1.5 text-[8px] md:text-[9px] font-black text-brand-text-dim uppercase tracking-[0.2em]">
                        <Code2 size={8} className="text-brand-primary" />
                        Built with
                        <Heart size={8} className="text-brand-danger" fill="currentColor" />
                        by Crammerly Team
                    </div>
                    <p className="text-[7px] md:text-[8px] font-medium text-brand-muted mt-2 uppercase tracking-widest">© 2026 Crammerly Systems Inc. All rights reserved.</p>

                </div>
            </div>
        </div>
    );
}

export default AboutModal;
