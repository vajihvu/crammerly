import React, { useEffect, useState } from 'react';
import { bugsApi } from '../api';
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft, Image as ImageIcon, ChevronRight, ChevronLeft, CheckCircle2, ChevronDown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [bugs, setBugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [expandedBug, setExpandedBug] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBugs(1);
    }, []);

    const fetchBugs = async (page) => {
        setLoading(true);
        try {
            const res = await bugsApi.getBugReports(page, 20);
            if (res.success && res.data) {
                setBugs(res.data);
                setPagination(res.pagination);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load bug reports');
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Look/Design': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Broken': return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20';
            case 'Sound/Video': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-primary/30">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-brand-surface/80 backdrop-blur-xl border-b border-brand-border shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/20 rounded-full transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className="text-brand-primary" />
                                <span className="font-[1000] text-brand-text tracking-tighter text-lg leading-none uppercase">Admin Console</span>
                            </div>
                            <span className="text-[9px] font-black text-brand-text-dim uppercase tracking-[0.2em] -mt-0.5">Secure Area</span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-[1000] text-brand-text uppercase tracking-tighter mb-1">Bug Reports</h1>
                        <p className="text-xs font-bold text-brand-text-dim uppercase tracking-widest">
                            {pagination.total} Tickets Logged
                        </p>
                    </div>
                </div>

                <div className="bg-brand-surface border border-brand-border/40 rounded-[24px] shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 text-brand-text-dim">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest">Fetching DB Payload...</span>
                        </div>
                    ) : error ? (
                        <div className="p-10 text-center">
                            <AlertCircle size={40} className="mx-auto text-brand-danger opacity-50 mb-4" />
                            <p className="text-brand-danger font-bold text-sm">{error}</p>
                        </div>
                    ) : bugs.length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-brand-success/10 rounded-full flex items-center justify-center mb-4 border border-brand-success/20">
                                <CheckCircle2 size={32} className="text-brand-success" />
                            </div>
                            <h3 className="text-lg font-black text-brand-text uppercase tracking-tight mb-2">Zero Bugs Reported</h3>
                            <p className="text-xs font-bold text-brand-text-dim uppercase tracking-widest">The payload is squeaky clean.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-brand-border/30">
                            {bugs.map((bug) => (
                                <div key={bug._id} className="transition-colors hover:bg-brand-bg/30">
                                    <div 
                                        className="p-5 flex items-start gap-4 cursor-pointer"
                                        onClick={() => setExpandedBug(expandedBug === bug._id ? null : bug._id)}
                                    >
                                        <div className="shrink-0 pt-1">
                                            <div className="w-10 h-10 bg-brand-bg border border-brand-border/50 rounded-xl flex items-center justify-center shadow-sm">
                                                {bug.image ? <ImageIcon size={18} className="text-brand-text-dim" /> : <Lock size={18} className="text-brand-text/20" />}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${getTypeColor(bug.type)}`}>
                                                    {bug.type}
                                                </span>
                                                <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-wider">
                                                    {new Date(bug.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            <h4 className="text-sm font-black text-brand-text truncate w-full group-hover:text-brand-primary transition-colors">
                                                {bug.title}
                                            </h4>
                                            
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-bold text-brand-text/50">Reporter:</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 bg-brand-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                                                        {bug.user?.avatar ? (
                                                            <img src={bug.user.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[8px] font-black text-brand-primary">{(bug.user?.name || '?')[0]}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-brand-text-dim truncate max-w-[120px]">{bug.user?.email || 'Unknown User'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="shrink-0 flex items-center h-10 px-2 text-brand-text-dim">
                                            {expandedBug === bug._id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </div>

                                    {/* Expanded Content View */}
                                    {expandedBug === bug._id && (
                                        <div className="px-5 pb-6 pt-2 bg-brand-bg/50 border-t border-brand-border/10 animate-in slide-in-from-top-2 duration-200">
                                            <div className="pl-14">
                                                {/* Description Block */}
                                                <div className="bg-brand-surface border border-brand-border/30 rounded-2xl p-4 mb-4 shadow-inner">
                                                    <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2">Description</h5>
                                                    <p className="text-xs text-brand-text/90 font-medium leading-relaxed whitespace-pre-wrap">
                                                        {bug.description}
                                                    </p>
                                                </div>

                                                {/* Base64 Image Render Block */}
                                                {bug.image && (
                                                    <div className="bg-brand-surface border border-brand-border/30 rounded-2xl p-2 shadow-inner inline-block max-w-full">
                                                        <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2 px-2 pt-2">Attached Screenshot</h5>
                                                        <img 
                                                            src={bug.image} 
                                                            alt="Bug Report Payload" 
                                                            className="max-w-full md:max-w-2xl rounded-xl border border-brand-border/20"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => fetchBugs(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 bg-brand-surface border border-brand-border/30 rounded-xl disabled:opacity-30 hover:bg-brand-muted/20 transition-all font-bold text-brand-text"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[11px] font-black uppercase tracking-widest text-brand-text px-4">
                            Page {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => fetchBugs(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                            className="p-2 bg-brand-surface border border-brand-border/30 rounded-xl disabled:opacity-30 hover:bg-brand-muted/20 transition-all font-bold text-brand-text"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
