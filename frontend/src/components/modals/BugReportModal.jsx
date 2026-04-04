import React, { useState, useRef } from 'react';
import { X, AlertCircle, Send, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { bugsApi } from '../../api';

function BugReportModal({ onClose }) {
    const [submitted, setSubmitted] = useState(false);
    const [bugData, setBugData] = useState({ title: '', desc: '', type: 'Look/Design' });
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const getBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            let base64Image = '';
            if (fileInputRef.current?.files[0]) {
                base64Image = await getBase64(fileInputRef.current.files[0]);
            }
            await bugsApi.submitBug({
                type: bugData.type,
                title: bugData.title,
                description: bugData.desc,
                image: base64Image
            });
            setSubmitted(true);
            setTimeout(() => onClose(), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit bug report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300">
                <div className="bg-brand-surface sm:rounded-[32px] w-full h-full sm:h-auto sm:max-w-sm p-8 md:p-10 text-center flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 shadow-2xl border-0 sm:border border-brand-border/30">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-success/10 rounded-full flex items-center justify-center mb-5 text-brand-success border-2 border-brand-success/20">
                        <CheckCircle2 size={32} className="md:w-10 md:h-10 animate-in zoom-in duration-500" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-[1000] text-brand-text tracking-tighter uppercase mb-2">Bug Reported</h2>
                    <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] opacity-80">Thank you for improving Crammerly</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[32px] w-full max-w-md h-full sm:h-auto sm:max-h-[85vh] border-0 sm:border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col font-sans overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="p-5 md:p-8 pb-3 flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-brand-danger/10 rounded-xl flex items-center justify-center text-brand-danger">
                                <AlertCircle size={20} className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl md:text-2xl font-[1000] text-brand-text tracking-tighter uppercase leading-none pt-1">Fix a Problem</h2>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] ml-12 md:ml-14 opacity-80">Tell us what is wrong</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all shadow-md border border-brand-border/30"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 md:px-8 pb-8">
                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 pt-3">
                        <div>
                            <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-2 px-1">Type of problem</label>
                            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                                {['Look/Design', 'Broken', 'Sound/Video'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setBugData({ ...bugData, type })}
                                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${bugData.type === type
                                            ? 'bg-brand-primary text-white border-brand-primary shadow-lg'
                                            : 'bg-brand-bg/50 text-brand-text-dim border-brand-border/30 hover:border-brand-primary/50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-2 px-1">Short title</label>
                            <input
                                required
                                type="text"
                                value={bugData.title}
                                onChange={e => setBugData({...bugData, title: e.target.value})}
                                disabled={isSubmitting}
                                placeholder="What is the problem?"
                                className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted disabled:opacity-50"
                            />
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-2 px-1">More details</label>
                            <textarea
                                required
                                rows={3}
                                value={bugData.desc}
                                onChange={e => setBugData({...bugData, desc: e.target.value})}
                                disabled={isSubmitting}
                                placeholder="How can we find the problem?"
                                className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted resize-none md:max-h-24 disabled:opacity-50"
                            ></textarea>
                        </div>
                        
                        {error && <p className="text-[10px] font-bold text-brand-danger uppercase tracking-widest text-center">{error}</p>}

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                            <div className="flex items-center gap-4">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    ref={fileInputRef} 
                                    onChange={handleImageChange} 
                                    className="hidden" 
                                />
                                {imagePreview ? (
                                    <div className="relative group/preview flex items-center gap-2">
                                        <img src={imagePreview} alt="Bug preview" className="h-10 w-10 md:h-12 md:w-12 object-cover rounded-lg border border-brand-border/40 shadow-sm" />
                                        <button 
                                            type="button" 
                                            onClick={removeImage} 
                                            disabled={isSubmitting}
                                            className="bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white rounded-md p-1.5 transition-colors absolute -top-1.5 -right-1.5 shadow-md disabled:opacity-50"
                                        >
                                            <X size={10} strokeWidth={4} />
                                        </button>
                                        <span className="text-[8px] font-bold text-brand-success uppercase tracking-widest leading-tight">Image<br/>Attached</span>
                                    </div>
                                ) : (
                                    <button type="button" disabled={isSubmitting} onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-brand-primary hover:text-brand-text transition-colors group disabled:opacity-50">
                                        <ImageIcon size={18} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Add a picture</span>
                                    </button>
                                )}
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-6 py-3 bg-brand-text text-brand-bg rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                                {isSubmitting ? 'Sending...' : 'Send'} <Send size={14} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default BugReportModal;
