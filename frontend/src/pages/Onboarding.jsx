import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { useUI } from '../context/UIContext';
import { Sparkles, User, GraduationCap, BookOpen, Heart, Zap, ArrowRight, X, Loader2 } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const { addToast } = useUI();
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState('');
    const [institution, setInstitution] = useState('');
    const [course, setCourse] = useState('');
    const [interests, setInterests] = useState([]);
    const [skills, setSkills] = useState([]);
    const [interestInput, setInterestInput] = useState('');
    const [skillInput, setSkillInput] = useState('');

    const addTag = (type) => {
        if (type === 'interest' && interestInput.trim()) {
            if (!interests.includes(interestInput.trim())) {
                setInterests([...interests, interestInput.trim()]);
            }
            setInterestInput('');
        } else if (type === 'skill' && skillInput.trim()) {
            if (!skills.includes(skillInput.trim())) {
                setSkills([...skills, skillInput.trim()]);
            }
            setSkillInput('');
        }
    };

    const removeTag = (type, value) => {
        if (type === 'interest') {
            setInterests(interests.filter(i => i !== value));
        } else {
            setSkills(skills.filter(s => s !== value));
        }
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(type);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await usersApi.updateProfile({
                username: username || undefined,
                institution: institution || undefined,
                course: course || undefined,
                interests: interests.length > 0 ? interests : undefined,
                skills: skills.length > 0 ? skills : undefined,
            });
            await usersApi.completeOnboarding();

            // Sync isOnboarded into cached user so Crammerly doesn't redirect back
            try {
                const stored = JSON.parse(localStorage.getItem('userInfo'));
                if (stored) {
                    stored.isOnboarded = true;
                    localStorage.setItem('userInfo', JSON.stringify(stored));
                }
            } catch { /* ignore parse errors */ }

            addToast('Profile set up successfully! Welcome to Crammerly.', 'success');
            window.location.href = '/'; // Full reload to pick up updated user state
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to save profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = async () => {
        try {
            await usersApi.completeOnboarding();
        } catch {
            // Silent — they can always update profile later
        }
        // Sync isOnboarded into cached user
        try {
            const stored = JSON.parse(localStorage.getItem('userInfo'));
            if (stored) {
                stored.isOnboarded = true;
                localStorage.setItem('userInfo', JSON.stringify(stored));
            }
        } catch { /* ignore */ }
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-brand-surface rounded-[32px] p-8 border border-brand-border/40 shadow-premium relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-success/8 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center mb-4 shadow-premium transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Sparkles size={24} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-brand-text tracking-tight">Complete Your Profile</h1>
                        <p className="text-xs text-brand-text-dim mt-1 text-center">Tell us a bit about yourself so we can personalize your experience</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest ml-1">Username</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                    placeholder="Choose a unique username"
                                />
                            </div>
                        </div>

                        {/* Institution */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest ml-1">College / Institution</label>
                            <div className="relative group">
                                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={institution}
                                    onChange={(e) => setInstitution(e.target.value)}
                                    className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                    placeholder="e.g. MIT, Stanford, IIT Delhi"
                                />
                            </div>
                        </div>

                        {/* Course */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest ml-1">Course / Major</label>
                            <div className="relative group">
                                <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={course}
                                    onChange={(e) => setCourse(e.target.value)}
                                    className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                    placeholder="e.g. Computer Science, Medicine"
                                />
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest ml-1">Interests</label>
                            <div className="relative group">
                                <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={interestInput}
                                    onChange={(e) => setInterestInput(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'interest')}
                                    className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                    placeholder="Type an interest and press Enter"
                                />
                            </div>
                            {interests.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {interests.map((tag) => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[10px] font-bold border border-brand-primary/20">
                                            {tag}
                                            <button type="button" onClick={() => removeTag('interest', tag)} className="hover:text-brand-danger transition-colors">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Skills */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest ml-1">Skills</label>
                            <div className="relative group">
                                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, 'skill')}
                                    className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                    placeholder="Type a skill and press Enter"
                                />
                            </div>
                            {skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {skills.map((tag) => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-success/10 text-brand-success rounded-lg text-[10px] font-bold border border-brand-success/20">
                                            {tag}
                                            <button type="button" onClick={() => removeTag('skill', tag)} className="hover:text-brand-danger transition-colors">
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="pt-3 space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-brand-text text-brand-bg rounded-xl font-bold text-xs shadow-premium hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Get Started <ArrowRight size={14} /></>}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="w-full text-center text-xs font-semibold text-brand-text-dim hover:text-brand-primary transition-colors py-1"
                            >
                                Skip for now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
