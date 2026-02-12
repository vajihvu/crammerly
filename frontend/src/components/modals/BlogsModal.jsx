// src/components/modals/BlogsModal.jsx
import React, { useState } from 'react';
import { X, ArrowLeft, BookOpen, Clock, User, Share2, ThumbsUp, MessageSquare } from 'lucide-react';

function BlogsModal({ onClose }) {
    const [selectedBlog, setSelectedBlog] = useState(null);

    const blogs = [
        {
            id: 1,
            title: 'Top 10 Data Structures Hacks',
            author: 'FOCUS MASTER',
            time: '5 MIN READ',
            category: 'COMPUTER SCIENCE',
            date: 'Jan 24, 2026',
            content: `Mastering data structures is the key to writing efficient code. Here are the top 10 hacks every developer should know:\n\n1. Use Hash Maps for O(1) lookups whenever possible.\n2. Understand the trade-offs between Arrays and Linked Lists.\n3. Master recursion, but be mindful of stack overflow.\n4. Circular buffers are great for streaming data.\n5. Binary Search is your best friend for sorted data.\n6. Use Tries for prefix-based searches.\n7. Min-Heaps/Max-Heaps are essential for priority queues.\n8. Don't forget about Space Complexity.\n9. Visualize your data structures before coding.\n10. Practice, practice, practice on Crammerly!`,
            image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80'
        },
        {
            id: 2,
            title: 'Future of Algorithms',
            author: 'TECH INSIDER',
            time: '8 MIN READ',
            category: 'ARTIFICIAL INTELLIGENCE',
            date: 'Jan 22, 2026',
            content: `As we move further into the decade, algorithms are becoming more autonomous and specialized. Machine learning is no longer just a buzzword; it's a fundamental part of how we process information.\n\nQuantum algorithms are on the horizon, promising to solve problems that are currently impossible for classical computers. Adaptive algorithms that learn from real-time data are becoming the standard in high-frequency trading and personalized medicine.`,
            image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80'
        },
        {
            id: 3,
            title: 'The Art of Deep Work',
            author: 'PRODUCTIVITY NINJA',
            time: '6 MIN READ',
            category: 'LIFESTYLE',
            date: 'Jan 20, 2026',
            content: `Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.\n\nIn our world of constant notifications and shallow work, those who can master the art of deep work will have a massive competitive advantage. Set aside blocks of time, turn off your phone, and dive deep into your studies.`,
            image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800&q=80'
        },
        {
            id: 4,
            title: 'React 19: What to Expect',
            author: 'JS WIZARD',
            time: '4 MIN READ',
            category: 'DEVELOPMENT',
            date: 'Jan 18, 2026',
            content: `React 19 is bringing some massive changes to how we handle state and side effects. With the introduction of the React Compiler (React Forget), many of the manual useMemo and useCallback optimizations will become a thing of the past.\n\nServer Components are also receiving significant updates to improve how we build full-stack applications with React.`,
            image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80'
        }
    ];

    if (selectedBlog) {
        return (
            <div className="fixed inset-0 bg-brand-bg/90 backdrop-blur-xl z-[150] flex items-start justify-center p-0 sm:p-4 pt-2 sm:pt-4 pb-6 overflow-y-auto animate-in fade-in duration-300" onClick={() => setSelectedBlog(null)}>
                <div className="bg-brand-surface w-full max-w-2xl min-h-screen sm:min-h-0 sm:h-[90vh] rounded-none sm:rounded-[40px] border-0 sm:border border-brand-border/30 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 font-sans" onClick={(e) => e.stopPropagation()}>
                    {/* Blog Detail Header */}
                    <div className="px-8 py-6 border-b border-brand-border/50 flex items-center justify-between bg-brand-surface/50 backdrop-blur-xl shrink-0">
                        <button
                            onClick={() => setSelectedBlog(null)}
                            className="px-4 py-2 bg-brand-card hover:bg-brand-surface text-brand-text-dim hover:text-brand-text rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 border border-brand-border/30 shadow-sm font-sans"
                        >
                            <ArrowLeft size={14} /> Back to List
                        </button>
                        <div className="flex items-center gap-2">
                            <button className="p-2.5 text-brand-text-dim hover:text-brand-primary hover:bg-brand-bg rounded-full transition-all">
                                <Share2 size={18} />
                            </button>
                            <button onClick={onClose} className="p-2.5 text-brand-text-dim hover:text-brand-danger hover:bg-brand-bg rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="aspect-video w-full rounded-[32px] overflow-hidden mb-8 border border-brand-border/30 group shadow-premium transition-all duration-700">
                            <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>

                        <div className="space-y-6 font-sans">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest border border-brand-primary/20 rounded-lg">
                                    {selectedBlog.category}
                                </span>
                                <span className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest">
                                    {selectedBlog.date}
                                </span>
                            </div>

                            <h2 className="text-4xl font-black text-brand-text tracking-tighter uppercase leading-none font-sans">
                                {selectedBlog.title}
                            </h2>

                            <div className="flex items-center gap-6 py-4 border-y border-brand-border/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center text-[12px] font-black text-brand-primary border border-brand-primary/30 shadow-sm">
                                        {selectedBlog.author[0]}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-brand-text-dim uppercase tracking-widest leading-none mb-1">Author</p>
                                        <p className="text-sm font-bold text-brand-text uppercase tracking-tighter">{selectedBlog.author}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pl-6 border-l border-brand-border/20">
                                    <div className="w-10 h-10 bg-brand-secondary/10 rounded-full flex items-center justify-center text-brand-secondary border border-brand-secondary/30 shadow-sm">
                                        <Clock size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-brand-text-dim uppercase tracking-widest leading-none mb-1">Duration</p>
                                        <p className="text-sm font-bold text-brand-text uppercase tracking-tighter">{selectedBlog.time}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-brand-text-dim text-lg leading-relaxed font-sans font-bold whitespace-pre-wrap py-4 border-l-4 border-brand-primary pl-6">
                                {selectedBlog.content}
                            </div>

                            <div className="flex items-center gap-4 pt-8">
                                <button className="flex items-center gap-2 px-8 py-4 bg-brand-text hover:bg-black text-brand-bg rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium transition-all active:scale-95">
                                    <ThumbsUp size={16} /> Appreciate
                                </button>
                                <button className="flex items-center gap-2 px-8 py-4 bg-brand-bg hover:bg-brand-card text-brand-text rounded-2xl text-[11px] font-black uppercase tracking-widest border border-brand-border/50 transition-all active:scale-95">
                                    <MessageSquare size={16} /> Engage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-start justify-center p-0 sm:p-4 pt-2 sm:pt-4 pb-10 overflow-y-auto z-[150] animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-brand-surface w-full max-w-3xl min-h-screen sm:min-h-0 sm:h-[85vh] rounded-none sm:rounded-[40px] border-0 sm:border border-brand-border/30 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 font-sans" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="px-8 py-6 flex items-center justify-between border-b border-brand-border/30 bg-brand-surface/50 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-primary/10 flex items-center justify-center rounded-2xl border border-brand-primary/20">
                            <BookOpen size={20} className="text-brand-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-brand-text tracking-tighter uppercase leading-none font-sans">Explore <span className="text-brand-primary">Blogs</span></h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-brand-text-dim hover:text-brand-danger hover:bg-brand-bg rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Blog Grid */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-brand-bg/30 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {blogs.map((blog) => (
                            <div
                                key={blog.id}
                                onClick={() => setSelectedBlog(blog)}
                                className="group cursor-pointer bg-brand-surface rounded-[32px] border border-brand-border/30 hover:border-brand-primary transition-all duration-500 shadow-premium flex flex-col overflow-hidden hover:-translate-y-1"
                            >
                                <div className="h-44 w-full relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-brand-surface/80 backdrop-blur-md text-brand-primary text-[9px] font-black uppercase tracking-widest rounded-lg border border-brand-primary/20">
                                            {blog.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <h3 className="text-xl font-black text-brand-text group-hover:text-brand-primary transition-colors leading-tight uppercase tracking-tighter font-sans">{blog.title}</h3>
                                    <div className="flex justify-between items-center pt-4 border-t border-brand-border/30">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest leading-none mb-1 font-sans">Author</span>
                                            <span className="text-xs font-bold text-brand-text-dim uppercase tracking-tight font-sans">{blog.author}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest leading-none mb-1 font-sans">Duration</span>
                                            <span className="text-xs font-bold text-brand-secondary uppercase tracking-tight font-sans">{blog.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BlogsModal;
