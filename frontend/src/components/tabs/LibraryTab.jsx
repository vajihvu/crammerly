// src/components/tabs/LibraryTab.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ExternalLink, Trash2, FileText, Link as LinkIcon, Image, Video, File, X, Tag, Filter } from 'lucide-react';
import { resourcesApi } from '../../api/resources';

const TYPE_CONFIG = {
    link: { icon: LinkIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    pdf: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10' },
    document: { icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    image: { icon: Image, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    video: { icon: Video, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    other: { icon: File, color: 'text-brand-text-dim', bg: 'bg-brand-muted/10' },
};

function autoDetectType(url) {
    const lower = url.toLowerCase();
    if (lower.includes('.pdf')) return 'pdf';
    if (lower.includes('docs.google.com') || lower.includes('.doc')) return 'document';
    if (lower.match(/\.(jpg|jpeg|png|gif|webp|svg)/)) return 'image';
    if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.match(/\.(mp4|mov|avi)/)) return 'video';
    return 'link';
}

function getDomain(url) {
    try {
        const u = new URL(url);
        return u.hostname.replace('www.', '');
    } catch { return ''; }
}

// ─── Resource Card ───
function ResourceCard({ resource, onDelete, isOwnerOrAdder }) {
    const typeConfig = TYPE_CONFIG[resource.type] || TYPE_CONFIG.other;
    const IconComponent = typeConfig.icon;

    return (
        <div className="bg-brand-bg rounded-xl p-4 border border-brand-border/30 hover:border-brand-primary/30 transition-all group relative">
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                    <IconComponent size={18} className={typeConfig.color} />
                </div>
                <div className="flex-1 min-w-0">
                    <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sm text-brand-text hover:text-brand-primary transition-colors flex items-center gap-1.5 group/link"
                    >
                        <span className="truncate">{resource.title}</span>
                        <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                    </a>
                    {resource.description && (
                        <p className="text-xs text-brand-text-dim mt-0.5 line-clamp-2">{resource.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[9px] font-bold text-brand-text-dim bg-brand-surface px-1.5 py-0.5 rounded">
                            {getDomain(resource.url)}
                        </span>
                        {(resource.tags || []).map((tag, i) => (
                            <span key={i} className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                {tag}
                            </span>
                        ))}
                        <span className="text-[9px] text-brand-text-dim ml-auto">
                            by {resource.addedBy?.name || 'Unknown'} · {new Date(resource.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                {isOwnerOrAdder && (
                    <button
                        onClick={() => onDelete(resource._id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-brand-text-dim hover:text-red-400 transition-all shrink-0"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Add Resource Form ───
function AddResourceForm({ onAdd, onClose }) {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('link');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);

    const handleUrlChange = (e) => {
        const val = e.target.value;
        setUrl(val);
        if (val) setType(autoDetectType(val));
    };

    const addTag = () => {
        if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleSubmit = () => {
        if (!title.trim() || !url.trim()) return;
        onAdd({ title: title.trim(), url: url.trim(), type, description: description.trim(), tags });
        onClose();
    };

    return (
        <div className="bg-brand-card rounded-2xl p-4 border border-brand-primary/30 space-y-3 animate-in fade-in zoom-in-95 duration-200 mb-3 shrink-0">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Add Resource</span>
                <button onClick={onClose} className="p-1 hover:bg-brand-muted/20 rounded"><X size={14} className="text-brand-text-dim" /></button>
            </div>
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resource title (e.g. Research Paper on AI)"
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm font-bold text-brand-text focus:outline-none focus:border-brand-primary/50"
                autoFocus
            />
            <input
                value={url}
                onChange={handleUrlChange}
                placeholder="Paste URL (Google Drive, YouTube, website...)"
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-primary/50"
            />
            <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description (optional)"
                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text-dim focus:outline-none"
            />
            <div className="flex items-center gap-2">
                <div className="flex gap-1.5 flex-wrap flex-1">
                    {tags.map((tag, i) => (
                        <span key={i} className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center gap-1">
                            {tag}
                            <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="hover:text-red-400"><X size={8} /></button>
                        </span>
                    ))}
                    {tags.length < 5 && (
                        <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="+ tag"
                            className="bg-transparent text-[10px] font-bold text-brand-text-dim focus:outline-none w-16"
                        />
                    )}
                </div>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-[10px] font-bold text-brand-text focus:outline-none"
                >
                    {Object.keys(TYPE_CONFIG).map(t => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={handleSubmit}
                disabled={!title.trim() || !url.trim()}
                className="w-full py-2.5 bg-brand-primary text-brand-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <Plus size={14} />Add to Library
            </button>
        </div>
    );
}

// ─── Main Library Tab ───
function LibraryTab({ room, currentUser, addToast }) {
    const [resources, setResources] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTag, setActiveTag] = useState('');

    const loadResources = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (searchQuery) params.search = searchQuery;
            if (activeTag) params.tag = activeTag;
            const data = await resourcesApi.getAll(room.id, params);
            setResources(data.resources || []);
            setAllTags(data.tags || []);
        } catch {
            if (addToast) addToast('Failed to load resources', 'error');
        } finally {
            setLoading(false);
        }
    }, [room.id, searchQuery, activeTag, addToast]);

    useEffect(() => { loadResources(); }, [loadResources]);

    const handleAdd = async (resourceData) => {
        try {
            const newResource = await resourcesApi.create(room.id, resourceData);
            setResources(prev => [newResource, ...prev]);
            // Update tags
            const newTags = [...new Set([...allTags, ...(resourceData.tags || [])])];
            setAllTags(newTags);
            if (addToast) addToast('Resource added!', 'success');
        } catch (err) {
            if (addToast) addToast(err.response?.data?.message || 'Failed to add resource', 'error');
        }
    };

    const handleDelete = async (resourceId) => {
        try {
            await resourcesApi.remove(room.id, resourceId);
            setResources(prev => prev.filter(r => r._id !== resourceId));
            if (addToast) addToast('Resource removed', 'success');
        } catch {
            if (addToast) addToast('Failed to delete resource', 'error');
        }
    };

    const isOwner = room.creatorId === currentUser.id;

    return (
        <div className="flex-1 flex flex-col gap-3 min-h-0 h-full overflow-y-auto custom-scrollbar">
            {/* Header + search */}
            <div className="bg-brand-card rounded-2xl p-4 border border-brand-border shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-brand-text flex items-center gap-2">
                        <FileText size={16} className="text-brand-primary" />
                        Resource Library
                        <span className="text-[10px] font-bold text-brand-text-dim normal-case tracking-normal">({resources.length})</span>
                    </h3>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-3 py-1.5 bg-brand-primary text-brand-bg rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center gap-1"
                    >
                        <Plus size={12} />{showAddForm ? 'Cancel' : 'Add'}
                    </button>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-dim" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search resources..."
                        className="w-full pl-9 pr-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-brand-primary/50"
                    />
                </div>

                {/* Tag filters */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        <button
                            onClick={() => setActiveTag('')}
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border transition-all ${
                                !activeTag ? 'bg-brand-primary text-brand-bg border-brand-primary' : 'bg-brand-bg text-brand-text-dim border-brand-border hover:border-brand-primary/40'
                            }`}
                        >
                            All
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border transition-all ${
                                    activeTag === tag ? 'bg-brand-primary text-brand-bg border-brand-primary' : 'bg-brand-bg text-brand-text-dim border-brand-border hover:border-brand-primary/40'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Add form */}
            {showAddForm && <AddResourceForm onAdd={handleAdd} onClose={() => setShowAddForm(false)} />}

            {/* Resources list */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-pulse text-brand-text-dim text-sm font-bold">Loading library...</div>
                </div>
            ) : resources.length === 0 ? (
                <div className="bg-brand-card rounded-2xl p-12 text-center border-2 border-dashed border-brand-border flex-1 flex flex-col items-center justify-center">
                    <FileText size={40} className="text-brand-text-dim/30 mb-4" />
                    <h4 className="text-lg font-bold text-brand-text-dim mb-2">No resources yet</h4>
                    <p className="text-sm text-brand-text-dim/60 mb-4 max-w-xs">
                        Add links to research papers, Google Docs, YouTube videos, or any other project resources.
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-brand-primary text-brand-bg rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all"
                    >
                        Add First Resource
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {resources.map(resource => (
                        <ResourceCard
                            key={resource._id}
                            resource={resource}
                            onDelete={handleDelete}
                            isOwnerOrAdder={isOwner || resource.addedBy?._id === currentUser.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default LibraryTab;
