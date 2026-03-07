import React, { useState, useEffect } from 'react';
import { X, Users, Search, ArrowRight, Loader } from 'lucide-react';
import { roomsApi } from '../../api';

function GlobalSearchModal({ onClose, onJoinRoom }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allRooms, setAllRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const data = await roomsApi.getAll();
                setAllRooms(data || []);
            } catch (err) {
                console.error('Failed to load rooms:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    const filteredRooms = allRooms.filter(room => {
        if (!searchTerm.trim()) return true;
        const name = room?.name || '';
        const topic = room?.topic || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            topic.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-6" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"></div>

            {/* Modal Content */}
            <div
                className="relative bg-brand-surface w-full max-w-xl h-auto max-h-[90vh] sm:max-h-[85vh] rounded-[24px] sm:rounded-[40px] border border-brand-border/40 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 font-sans"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-brand-border/30 flex flex-col shrink-0 bg-brand-surface/50 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-brand-primary/20 shrink-0">
                                <Search className="text-brand-primary w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <h3 className="text-base sm:text-xl font-black text-brand-text uppercase tracking-tight truncate">Search Rooms</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-brand-text-dim hover:text-brand-text transition-all bg-brand-bg/50 hover:bg-brand-bg rounded-xl shrink-0 border border-brand-border/20"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Input Area */}
                    <div className="relative group flex items-center">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-brand-text-dim group-focus-within:text-brand-primary transition-colors sm:w-[18px]" />
                        </div>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Find a room by name or topic..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-brand-bg border border-brand-border/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-bold text-brand-text"
                        />
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-brand-bg/10">
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                <Loader size={32} className="animate-spin text-brand-primary mb-3" />
                                <p className="text-xs font-black text-brand-text-dim uppercase tracking-widest">Loading rooms...</p>
                            </div>
                        ) : filteredRooms.length === 0 ? (
                            <EmptyState icon={<Users size={48} />} text={searchTerm ? `No rooms found for "${searchTerm}"` : 'No rooms available'} />
                        ) : (
                            filteredRooms.map(room => (
                                <ResultCard
                                    key={room.id}
                                    title={room.name}
                                    subtitle={room.topic}
                                    meta={`${(room?.members || []).length} Members`}
                                    buttonText="Join"
                                    onAction={() => onJoinRoom(room)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


function ResultCard({ title, subtitle, meta, buttonText, onAction }) {
    return (
        <div className="bg-brand-surface p-4 sm:p-5 rounded-2xl border border-brand-border/40 hover:border-brand-primary/50 transition-all group flex items-center justify-between gap-4 shadow-sm">
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-brand-text truncate group-hover:text-brand-primary transition-colors text-sm sm:text-lg">{title}</h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="px-2 py-0.5 bg-brand-primary/10 rounded-md text-[8px] sm:text-[9px] font-black text-brand-primary uppercase tracking-wider shrink-0">{subtitle}</span>
                    <span className="text-[10px] text-brand-text-dim font-bold flex items-center gap-1 shrink-0 uppercase tracking-widest opacity-60">
                        {meta}
                    </span>
                </div>
            </div>
            <button
                onClick={onAction}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-brand-text hover:bg-black text-brand-bg rounded-xl font-[1000] text-[9px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-95 group/btn"
            >
                {buttonText}
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}

function EmptyState({ icon, text }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <div className="mb-4 text-brand-text-dim">
                {icon}
            </div>
            <p className="text-xs font-black text-brand-text-dim uppercase tracking-widest px-4 max-w-[200px]">
                {text}
            </p>
        </div>
    );
}

export default GlobalSearchModal;
