import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { recordsApi } from '../api';
import {
    Plus,
    Search,
    Trash2,
    Edit3,
    MoreHorizontal,
    Calendar,
    Tag as TagIcon,
    LayoutGrid,
    List,
    LogOut,
    Database,
    Loader2,
    X,
    FileText
} from 'lucide-react';

const Home = () => {
    const { user, logout } = useAuth();
    const { addToast } = useUI();
    const [records, setRecords] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({ title: '', content: '', status: 'draft', tags: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);

    const fetchRecords = useCallback(async (cursor = null) => {
        try {
            const response = await recordsApi.getAll({ cursor, limit: 12 });
            const data = response.data;

            if (cursor) {
                setRecords(prev => [...prev, ...data.records]);
            } else {
                setRecords(data.records);
            }

            setNextCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            // Error is handled globally by UIContext
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleOpenModal = (record = null) => {
        if (record) {
            setCurrentRecord(record);
            setFormData({
                title: record.title,
                content: record.content,
                status: record.status,
                tags: record.tags.join(', ')
            });
        } else {
            setCurrentRecord(null);
            setFormData({ title: '', content: '', status: 'draft', tags: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRecord(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
        const payload = { ...formData, tags };

        try {
            if (currentRecord) {
                await recordsApi.update(currentRecord._id, payload);
                addToast('Record updated successfully', 'success');
            } else {
                await recordsApi.create(payload);
                addToast('Record created successfully', 'success');
            }
            fetchRecords();
            handleCloseModal();
        } catch {
            // Error is handled globally
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await recordsApi.delete(id);
                setRecords(records.filter(r => r._id !== id));
                addToast('Record deleted', 'info');
            } catch {
                // Error is handled globally
            }
        }
    };

    const filteredRecords = records.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200">
            {/* Sidebar / Top Nav Overlay */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">

                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                            <Database className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">Workspace</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{user?.name}</span>
                        </h1>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center space-x-2 group"
                        >
                            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-white" />
                            <span className="text-sm font-medium">Sign Out</span>
                        </button>
                        <button
                            onClick={() => handleOpenModal()}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-semibold transition-all flex items-center space-x-2 transform active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create New</span>
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                    {[
                        { label: 'Total Records', value: records.length, color: 'indigo' },
                        { label: 'Published', value: records.filter(r => r.status === 'published').length, color: 'emerald' },
                        { label: 'Drafts', value: records.filter(r => r.status === 'draft').length, color: 'amber' },
                        { label: 'Active User', value: user?.email, color: 'purple' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="bg-white/5 border border-white/5 rounded-2xl p-5 backdrop-blur-sm animate-fade-in-up"
                            style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
                        >
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-xl font-bold text-white truncate">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="flex items-center justify-between mb-8 bg-white/5 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search records by title or content..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none py-3 pl-12 pr-12 text-white focus:ring-0 placeholder:text-slate-600"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                {filteredRecords.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRecords.map((record, i) => (
                                <div
                                    key={record._id}
                                    className="group bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 rounded-[32px] p-6 transition-all duration-500 relative overflow-hidden backdrop-blur-sm hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] hover:-translate-y-1 animate-fade-in-up"
                                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                                >
                                    {/* Visual accent */}
                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${record.status === 'published' ? 'bg-indigo-500' : 'bg-slate-700'} opacity-50 group-hover:opacity-100 transition-opacity`}></div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${record.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                                            }`}>
                                            {record.status}
                                        </div>
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal(record)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record._id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{record.title}</h3>
                                    <p className="text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                                        {record.content}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {record.tags.map((tag, i) => (
                                            <span key={i} className="flex items-center space-x-1 text-[11px] px-2 py-1 bg-white/5 border border-white/10 rounded-md text-slate-400">
                                                <TagIcon className="w-3 h-3" />
                                                <span>{tag}</span>
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-slate-500 text-[11px] font-medium">
                                        <div className="flex items-center space-x-1">
                                            <Calendar className="w-3 h-3" />
                                            <span>{new Date(record.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <FileText className="w-3 h-3" />
                                            <span>{record.content.length} chars</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex justify-center mt-12">
                                <button
                                    onClick={() => fetchRecords(nextCursor)}
                                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 hover:text-white font-semibold transition-all flex items-center space-x-2"
                                >
                                    <span>Load More Records</span>
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-32 bg-white/2 border border-dashed border-white/10 rounded-[40px]">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 mb-6">
                            <Search className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">No records found</h3>
                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                            Ready to start your collection? Create your first record to see it appear here.
                        </p>
                    </div>
                )}
            </div>

            {/* Modern Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleCloseModal}></div>
                    <div className="bg-slate-900 border-0 sm:border border-white/10 w-full max-w-2xl h-full sm:h-auto sm:rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in duration-200 flex flex-col">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-white/2">
                            <h2 className="text-2xl font-bold text-white">
                                {currentRecord ? 'Edit Record' : 'Create New Record'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Title</label>
                                        <input
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                            placeholder="e.g. Design Strategy 2026"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Content</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        placeholder="Describe your record in detail..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Tags (comma separated)</label>
                                    <input
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="work, personal, ideas"
                                    />
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 font-semibold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 transform active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{currentRecord ? 'Update Record' : 'Create Record'}</span>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
