import React, { useEffect, useState, useCallback } from 'react';
import { bugsApi, adminApi } from '../api';
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft, Image as ImageIcon, ChevronRight, ChevronLeft, CheckCircle2, ChevronDown, Lock, Users, Search, UserMinus, UserCheck, ShieldAlert, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('bugs'); // 'bugs' or 'users'
    const [bugs, setBugs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [expandedBug, setExpandedBug] = useState(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchData = useCallback(async (page) => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'bugs') {
                const res = await bugsApi.getBugReports(page, 20);
                if (res.success && res.data) {
                    setBugs(res.data);
                    if (res.pagination) setPagination(res.pagination);
                }
            } else {
                const res = await adminApi.getUsers(page, 20, userSearchTerm);
                if (res.success && res.data) {
                    setUsers(res.data);
                    if (res.pagination) setPagination(res.pagination);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to load ${activeTab}`);
        } finally {
            setLoading(false);
        }
    }, [activeTab, userSearchTerm]);

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    const handleUserSearch = (e) => {
        e.preventDefault();
        fetchData(1);
    };

    const toggleUserStatus = async (id, currentStatus) => {
        try {
            await adminApi.toggleUserStatus(id, !currentStatus);
            setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user status');
        }
    };

    const updateUserRole = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            await adminApi.updateUserRole(id, newRole);
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user role');
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/')}
                            className="p-2 -ml-2 text-brand-text-dim hover:text-brand-text hover:bg-brand-muted/20 rounded-full transition-all"
                        >
                            <ArrowLeft size={18} sm:size={20} />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} sm:size={18} className="text-brand-primary" />
                                <span className="font-[1000] text-brand-text tracking-tighter text-base sm:text-lg leading-none uppercase">Admin Console</span>
                            </div>
                            <span className="hidden sm:block text-[9px] font-black text-brand-text-dim uppercase tracking-[0.2em] -mt-0.5">Secure Area</span>
                        </div>
                    </div>

                    <div className="flex bg-brand-bg rounded-xl sm:rounded-2xl p-0.5 sm:p-1 border border-brand-border/30">
                        <button
                            onClick={() => setActiveTab('bugs')}
                            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bugs' ? 'bg-brand-text text-brand-bg shadow-lg' : 'text-brand-text-dim hover:text-brand-text'}`}
                        >
                            Tickets
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-brand-text text-brand-bg shadow-lg' : 'text-brand-text-dim hover:text-brand-text'}`}
                        >
                            Users
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-[1000] text-brand-text uppercase tracking-tighter mb-0.5 sm:mb-1">
                            {activeTab === 'bugs' ? 'Bug Reports' : 'User Management'}
                        </h1>
                        <p className="text-[9px] sm:text-xs font-bold text-brand-text-dim uppercase tracking-widest">
                            {pagination?.total || 0} {activeTab === 'bugs' ? 'Tickets Logged' : 'Accounts Registered'}
                        </p>
                    </div>

                    {activeTab === 'users' && (
                        <form onSubmit={handleUserSearch} className="w-full sm:w-auto flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Search by name, email..." 
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-9 pr-4 py-2 bg-brand-surface border border-brand-border/40 rounded-xl text-[11px] font-bold text-brand-text focus:outline-none focus:border-brand-primary transition-all uppercase tracking-widest"
                                />
                            </div>
                            <button type="submit" className="px-4 py-2 bg-brand-text text-brand-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">Filter</button>
                        </form>
                    )}
                </div>

                <div className="bg-brand-surface border border-brand-border/40 rounded-[20px] sm:rounded-[24px] shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-12 sm:p-20 text-brand-text-dim">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest">Fetching DB Payload...</span>
                        </div>
                    ) : error ? (
                        <div className="p-10 text-center">
                            <AlertCircle size={40} className="mx-auto text-brand-danger opacity-50 mb-4" />
                            <p className="text-brand-danger font-bold text-sm">{error}</p>
                        </div>
                    ) : (activeTab === 'bugs' && bugs.length === 0) || (activeTab === 'users' && users.length === 0) ? (
                        <div className="p-20 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-brand-success/10 rounded-full flex items-center justify-center mb-4 border border-brand-success/20">
                                <CheckCircle2 size={32} className="text-brand-success" />
                            </div>
                            <h3 className="text-lg font-black text-brand-text uppercase tracking-tight mb-2">No Records Found</h3>
                            <p className="text-xs font-bold text-brand-text-dim uppercase tracking-widest">The database is currently clear.</p>
                        </div>
                    ) : activeTab === 'bugs' ? (
                        <div className="divide-y divide-brand-border/30">
                            {bugs.map((bug) => (
                                <div key={bug._id} className="transition-colors hover:bg-brand-bg/30">
                                    <div 
                                        className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 cursor-pointer"
                                        onClick={() => setExpandedBug(expandedBug === bug._id ? null : bug._id)}
                                    >
                                        <div className="shrink-0 pt-0.5 sm:pt-1">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-bg border border-brand-border/50 rounded-xl flex items-center justify-center shadow-sm">
                                                {bug.image ? <ImageIcon size={16} sm:size={18} className="text-brand-text-dim" /> : <Lock size={16} sm:size={18} className="text-brand-text/20" />}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                                                <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest border ${getTypeColor(bug.type)}`}>
                                                    {bug.type}
                                                </span>
                                                <span className="text-[8px] sm:text-[10px] font-bold text-brand-text-dim uppercase tracking-wider">
                                                    {new Date(bug.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            
                                            <h4 className="text-xs sm:text-sm font-black text-brand-text truncate w-full group-hover:text-brand-primary transition-colors">
                                                {bug.title}
                                            </h4>
                                            
                                            <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                                                <span className="text-[9px] sm:text-[10px] font-bold text-brand-text/50">Reporter:</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 bg-brand-primary/20 rounded-full flex items-center justify-center overflow-hidden">
                                                        {bug.user?.avatar ? (
                                                            <img src={bug.user.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[8px] font-black text-brand-primary">{(bug.user?.name || '?')[0]}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-brand-text-dim truncate max-w-[100px] sm:max-w-[200px]">{bug.user?.email || 'Unknown User'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="shrink-0 flex items-center h-8 sm:h-10 px-1 sm:px-2 text-brand-text-dim">
                                            {expandedBug === bug._id ? <ChevronDown size={18} sm:size={20} /> : <ChevronRight size={18} sm:size={20} />}
                                        </div>
                                    </div>

                                    {expandedBug === bug._id && (
                                        <div className="px-4 sm:px-5 pb-5 sm:pb-6 pt-1 sm:pt-2 bg-brand-bg/50 border-t border-brand-border/10 animate-in slide-in-from-top-2 duration-200">
                                            <div className="pl-11 sm:pl-14">
                                                <div className="bg-brand-surface border border-brand-border/30 rounded-2xl p-4 mb-4 shadow-inner">
                                                    <h5 className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-2">Description</h5>
                                                    <p className="text-xs text-brand-text/90 font-medium leading-relaxed whitespace-pre-wrap">
                                                        {bug.description}
                                                    </p>
                                                </div>

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
                    ) : (
                        /* User Management View */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-brand-bg/50 border-b border-brand-border/30">
                                        <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-text-dim">User</th>
                                        <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-text-dim hidden sm:table-cell">Role</th>
                                        <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-text-dim hidden md:table-cell">Joined</th>
                                        <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-text-dim">Status</th>
                                        <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-brand-text-dim text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border/30">
                                    {users.map((user) => (
                                        <tr key={user._id} className="transition-colors hover:bg-brand-bg/30 group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-brand-bg border-2 border-brand-border/50 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-black text-brand-primary">{(user.name || '?')[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black text-brand-text truncate uppercase tracking-tight">{user.name}</p>
                                                        <p className="text-[10px] font-bold text-brand-text-dim truncate tracking-wider">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 hidden sm:table-cell">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-brand-muted/10 text-brand-text-dim border-brand-border/20'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 hidden md:table-cell">
                                                <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-wider">
                                                    {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${user.isActive ? 'bg-brand-success/10 text-brand-success border-brand-success/20' : 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'}`}>
                                                    {user.isActive ? 'Active' : 'Banned'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                                                        title={user.isActive ? 'Ban User' : 'Unban User'}
                                                        className={`p-2 rounded-lg transition-all active:scale-95 ${user.isActive ? 'text-brand-danger hover:bg-brand-danger/10' : 'text-brand-success hover:bg-brand-success/10'}`}
                                                    >
                                                        {user.isActive ? <UserMinus size={18} /> : <UserCheck size={18} />}
                                                    </button>
                                                    <button 
                                                        onClick={() => updateUserRole(user._id, user.role)}
                                                        title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                        className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all active:scale-95"
                                                    >
                                                        {user.role === 'admin' ? <ShieldAlert size={18} /> : <Shield size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                            onClick={() => fetchData(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="p-2 bg-brand-surface border border-brand-border/30 rounded-xl disabled:opacity-30 hover:bg-brand-muted/20 transition-all font-bold text-brand-text"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[11px] font-black uppercase tracking-widest text-brand-text px-4">
                            Page {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => fetchData(pagination.page + 1)}
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
