// src/components/modals/ProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle, Github, Linkedin, Briefcase, GraduationCap, UserCircle, Camera, Share2, Copy, Check, Shield, Monitor, Globe, Trash2 } from 'lucide-react';
import { sessionsApi } from '../../api';

const StudyHeatmap = ({ activity = {} }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const cells = [];

  // Last 24 weeks (~6 months)
  for (let i = 0; i < 24 * 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const intensity = activity[dateStr] || 0;
    cells.push({ date: dateStr, intensity });
  }

  // Calculate month labels
  const monthLabels = [];
  let currentMonth = -1;
  const reversedCells = [...cells].reverse();

  for (let i = 0; i < reversedCells.length; i += 7) {
    const d = new Date(reversedCells[i].date);
    const month = d.getMonth();
    if (month !== currentMonth) {
      monthLabels.push({ label: months[month], index: i / 7 });
      currentMonth = month;
    }
  }

  return (
    <div className="bg-brand-surface rounded-[28px] p-6 border border-brand-border shadow-premium">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
            <CheckCircle size={14} className="text-brand-primary" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim">Past Activity</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-brand-text-dim uppercase tracking-widest opacity-40">Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 bg-brand-primary/5 rounded-[2px]"></div>
            <div className="w-2.5 h-2.5 bg-brand-primary/30 rounded-[2px]"></div>
            <div className="w-2.5 h-2.5 bg-brand-primary/60 rounded-[2px]"></div>
            <div className="w-2.5 h-2.5 bg-brand-primary rounded-[2px]"></div>
          </div>
          <span className="text-[8px] font-bold text-brand-text-dim uppercase tracking-widest opacity-40">More</span>
        </div>
      </div>

      <div className="relative">
        {/* Month Labels */}
        <div className="flex mb-2 h-4 relative">
          {(monthLabels || []).map((m, idx) => (
            <span
              key={idx}
              className="absolute text-[8px] font-black text-brand-text-dim uppercase tracking-widest opacity-50"
              style={{ left: `${(m.index / 24) * 100}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {(reversedCells || []).map((cell, idx) => {
            const intensityClass = cell.intensity === 0
              ? 'bg-brand-text/[0.03] border border-brand-border/20'
              : cell.intensity < 3 ? 'bg-brand-primary/30' :
                cell.intensity < 6 ? 'bg-brand-primary/60' : 'bg-brand-primary';
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-[3px] transition-all hover:scale-125 hover:shadow-accent cursor-help ${intensityClass}`}
                title={`${cell.date}: ${cell.intensity} activities`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

function ProfileModal({ currentUser = {}, onClose, onUpdateProfile, studyActivity = {} }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'security'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'User',
    username: 'unknown',
    tag: '0000',
    interests: [],
    skills: [],
    socialLinks: {},
    institution: '',
    course: '',
    ...currentUser
  });
  const [newInterest, setNewInterest] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [copied, setCopied] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (activeTab === 'security') {
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

  const copyId = () => {
    navigator.clipboard.writeText(`@${formData.username}#${formData.tag}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setFormData({
        ...formData,
        interests: [...(formData?.interests || []), newInterest.trim()]
      });
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      interests: (formData?.interests || []).filter(i => i !== interestToRemove)
    });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...(formData?.skills || []), newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: (formData?.skills || []).filter(s => s !== skillToRemove)
    });
  };

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };


  return (
    <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-start justify-center p-0 sm:p-4 pt-2 sm:pt-4 pb-10 overflow-y-auto z-[150] animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-brand-surface rounded-none sm:rounded-[40px] w-full max-w-lg border-0 sm:border border-brand-border/80 shadow-2xl flex flex-col overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[90vh] animate-in zoom-in-95 duration-500 relative font-sans" onClick={(e) => e.stopPropagation()}>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                setFormData({ ...formData, avatarUrl: event.target.result });
              };
              reader.readAsDataURL(file);
            }
          }}
        />

        {/* Flat Premium Header */}
        <div className="flex flex-col border-b border-brand-border/80 bg-brand-surface/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center justify-between px-3.5 sm:px-8 py-4 sm:py-6 gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-brand-primary/20 flex items-center justify-center rounded-xl border border-brand-primary/30 shrink-0">
                <UserCircle size={16} className="text-brand-primary sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[11px] sm:text-sm font-black text-brand-text uppercase tracking-wider sm:tracking-[0.2em] mt-0.5 truncate">Account</h3>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {activeTab === 'profile' && (
                <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-premium shrink-0 ${isEditing
                    ? 'bg-brand-primary text-brand-bg'
                    : 'bg-brand-text text-brand-bg hover:bg-brand-text/90'
                    }`}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              )}
              <button onClick={onClose} className="p-1.5 sm:p-2 text-brand-text-dim hover:text-brand-danger hover:bg-brand-bg rounded-full transition-all shrink-0">
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex px-3.5 sm:px-8 bg-brand-bg/30">
            <button
              onClick={() => { setActiveTab('profile'); setIsEditing(false); }}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'profile' ? 'text-brand-primary' : 'text-brand-text-dim hover:text-brand-text'}`}
            >
              Profile
              {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full" />}
            </button>
            <button
              onClick={() => { setActiveTab('security'); setIsEditing(false); }}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'security' ? 'text-brand-primary' : 'text-brand-text-dim hover:text-brand-text'}`}
            >
              Security
              {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-primary rounded-t-full" />}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
          {activeTab === 'profile' ? (
            <>
              {/* Enhanced Identity Section with Banner */}
              <div className="relative rounded-[32px] overflow-hidden border border-brand-border/80 shadow-premium bg-brand-surface">
                {/* Customizable Banner */}
                <div
                  className="h-28 sm:h-32 w-full transition-colors duration-500 relative"
                  style={{ backgroundColor: formData.bannerColor || '#3b82f6' }}
                >
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center gap-3">
                      {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#000000'].map(color => (
                        <button
                          key={color}
                          onClick={() => setFormData({ ...formData, bannerColor: color })}
                          className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${formData.bannerColor === color ? 'border-white scale-125' : 'border-transparent opacity-60'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-6 py-6 flex flex-col sm:flex-row items-center sm:items-end gap-5 relative z-10 text-center sm:text-left">
                  <div
                    className={`-mt-12 sm:-mt-16 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-xl sm:text-2xl font-bold shadow-2xl border-4 border-brand-surface shrink-0 relative overflow-hidden group/pfp bg-brand-surface ${isEditing ? 'cursor-pointer' : ''}`}
                    onClick={() => isEditing && fileInputRef.current.click()}
                  >
                    {formData?.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="PFP" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        {(formData?.name || formData?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 bg-brand-text/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover/pfp:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white mb-1" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest leading-none">Change Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 pb-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2 text-xl font-black text-brand-text focus:outline-none focus:border-brand-primary shadow-inner"
                          placeholder="Display Name"
                        />
                        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-brand-bg/50 border border-brand-border/80 rounded-lg group/copy">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest opacity-60">User ID:</span>
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">@{formData?.username || 'unknown'}#{formData?.tag || '0000'}</span>
                          </div>
                          <button
                            onClick={copyId}
                            className="p-1 hover:bg-brand-primary/10 rounded-md transition-all active:scale-95 text-brand-primary"
                            title="Copy User ID"
                          >
                            {copied ? <Check size={12} strokeWidth={3} /> : <Copy size={12} strokeWidth={3} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-2xl font-black text-brand-text tracking-tighter uppercase leading-none mb-1.5">{formData?.name || 'User'}</h3>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <div className="flex items-center gap-2 bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">@{formData?.username || 'user'}#{formData?.tag || '0000'}</span>
                            <button
                              onClick={copyId}
                              className="hover:text-brand-text transition-colors"
                              title="Copy User ID"
                            >
                              {copied ? <Check size={10} strokeWidth={4} /> : <Copy size={10} strokeWidth={4} />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Presence Section */}
              <div className="bg-brand-surface rounded-[32px] p-6 border border-brand-border/80 shadow-premium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
                    <Share2 size={14} className="text-brand-primary" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim">Socials</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* GitHub */}
                  <div className={`p-4 rounded-2xl border transition-all ${isEditing ? 'bg-brand-bg border-brand-border/80' : 'bg-brand-surface border-brand-border/60'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Github size={18} className="text-brand-text" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim">GitHub</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.socialLinks?.github || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, github: e.target.value }
                        })}
                        className="w-full bg-brand-surface border border-brand-border/60 rounded-lg px-3 py-2 text-xs font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                        placeholder="URL"
                      />
                    ) : (
                      <p className="text-sm font-bold text-brand-text truncate">
                        {formData.socialLinks?.github || 'Not linked'}
                      </p>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className={`p-4 rounded-2xl border transition-all ${isEditing ? 'bg-brand-bg border-brand-border/80' : 'bg-brand-surface border-brand-border/60'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Linkedin size={18} className="text-brand-text" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-text-dim">LinkedIn</span>
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.socialLinks?.linkedin || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                        })}
                        className="w-full bg-brand-surface border border-brand-border/60 rounded-lg px-3 py-2 text-xs font-bold text-brand-text focus:outline-none focus:border-brand-primary"
                        placeholder="URL"
                      />
                    ) : (
                      <p className="text-sm font-bold text-brand-text truncate">
                        {formData.socialLinks?.linkedin || 'Not linked'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Education Row */}
              <div className="bg-brand-surface rounded-[32px] p-8 border border-brand-border shadow-premium group flex items-start gap-6">
                <div className="w-14 h-14 bg-brand-secondary/10 rounded-2xl flex items-center justify-center border border-brand-secondary/20 shrink-0 mt-1">
                  <GraduationCap size={24} className="text-brand-secondary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[12px] font-black text-brand-text-dim uppercase tracking-[0.25em] mb-6">Education</h4>

                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest opacity-50">Institution</p>
                        <input
                          type="text"
                          value={formData.institution}
                          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-border/80 rounded-xl px-4 py-3 text-sm font-bold text-brand-text focus:outline-none focus:border-brand-secondary shadow-sm transition-all focus:ring-2 focus:ring-brand-secondary/10"
                          placeholder="University name..."
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest opacity-50">Course</p>
                        <input
                          type="text"
                          value={formData.course}
                          onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                          className="w-full bg-brand-bg border border-brand-border/80 rounded-xl px-4 py-3 text-sm font-bold text-brand-text focus:outline-none focus:border-brand-secondary shadow-sm transition-all focus:ring-2 focus:ring-brand-secondary/10"
                          placeholder="Degree path..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest opacity-50">Institution</p>
                        <p className="text-base font-black text-brand-text uppercase tracking-tight leading-tight">{formData.institution || 'Neutral Ground'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest opacity-50">Course</p>
                        <p className="text-base font-black text-brand-text uppercase tracking-tight leading-tight whitespace-normal">{formData.course || 'Independent Learner'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags & Skills */}
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-brand-primary/20 rounded-[28px] p-6 border border-brand-primary/80 space-y-4 shadow-premium">
                  <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.25em]">Interests</h4>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-brand-bg border border-brand-border/80 rounded-xl px-4 py-3 focus-within:border-brand-primary transition-all shadow-sm">
                        <Plus size={16} className="text-brand-primary" />
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                          className="bg-transparent text-sm font-bold text-brand-text focus:outline-none w-full placeholder:text-brand-primary/30"
                          placeholder="Add new interest..."
                        />
                        <button onClick={addInterest} className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-brand-bg rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-widest shrink-0 transition-all active:scale-95">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-border/40">
                        {(formData?.interests || []).length > 0 ? (formData?.interests || []).map((interest, idx) => (
                          <span key={idx} className="px-4 py-1.5 bg-brand-primary text-brand-bg rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2 group/tag">
                            {interest}
                            <button onClick={() => removeInterest(interest)} className="hover:text-brand-danger transition-colors group-hover/tag:scale-110">
                              <X size={12} strokeWidth={3} />
                            </button>
                          </span>
                        )) : (
                          <p className="text-[10px] font-bold text-brand-text-dim">No interests added yet...</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(formData?.interests || []).map((interest, idx) => (
                        <span key={idx} className="px-4 py-1.5 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-wider border border-brand-primary/40 flex items-center gap-2">
                          {interest}
                        </span>
                      ))}
                      {(formData?.interests || []).length === 0 && <p className="text-sm font-bold text-brand-text-dim">Exploring new frontiers...</p>}
                    </div>
                  )}
                </div>

                <div className="bg-brand-success/25 rounded-[28px] p-6 border border-brand-success/80 space-y-4 shadow-sm">
                  <h4 className="text-[10px] font-black text-brand-success uppercase tracking-[0.25em]">Technical Skills</h4>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-brand-bg border border-brand-success/40 rounded-xl px-4 py-3 focus-within:border-brand-success transition-all shadow-sm">
                        <Plus size={16} className="text-brand-success" />
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                          className="bg-transparent text-sm font-bold text-brand-text focus:outline-none w-full placeholder:text-brand-success/30"
                          placeholder="Add new skill..."
                        />
                        <button onClick={addSkill} className="px-3 py-1.5 bg-brand-success/10 hover:bg-brand-success text-brand-success hover:text-brand-bg rounded-lg font-black text-[9px] sm:text-[10px] uppercase tracking-widest shrink-0 transition-all active:scale-95">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-success/10">
                        {(formData?.skills || []).length > 0 ? (formData?.skills || []).map((skill, idx) => (
                          <span key={idx} className="px-4 py-1.5 bg-brand-success text-brand-bg rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2 group/tag">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="hover:text-brand-danger transition-colors group-hover/tag:scale-110">
                              <X size={12} strokeWidth={3} />
                            </button>
                          </span>
                        )) : (
                          <p className="text-[10px] font-bold text-brand-success/60">No skills added yet...</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(formData?.skills || []).map((skill, idx) => (
                        <span key={idx} className="px-4 py-1.5 bg-brand-success/20 text-brand-success rounded-full text-[10px] font-black uppercase tracking-wider border border-brand-success/50 flex items-center gap-2">
                          {skill}
                        </span>
                      ))}
                      {(formData?.skills || []).length === 0 && <p className="text-sm font-bold text-brand-success/40">Initialising skills...</p>}
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <StudyHeatmap activity={studyActivity} />
                )}
              </div>
            </>
          ) : (
            /* Security & Devices Content */
            <div className="space-y-6">
              <div className="bg-brand-surface rounded-[32px] p-6 border border-brand-border/80 shadow-premium">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center border border-brand-primary/20">
                    <Shield size={14} className="text-brand-primary" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-dim">Device History</h4>
                </div>

                <div className="space-y-4">
                  {loadingSessions ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest">Securing your account...</p>
                    </div>
                  ) : (sessions || []).length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm font-bold text-brand-text-dim">No active sessions found.</p>
                    </div>
                  ) : (
                    (sessions || []).map((session) => (
                      <div key={session.id} className="p-4 rounded-2xl border border-brand-border/40 bg-brand-bg/50 flex items-center gap-4 transition-all hover:border-brand-primary/30 group/session">
                        <div className="w-10 h-10 bg-brand-surface rounded-xl flex items-center justify-center border border-brand-border/60 shrink-0">
                          {session.userAgent?.toLowerCase().includes('windows') || session.userAgent?.toLowerCase().includes('mac') ? (
                            <Monitor size={18} className="text-brand-text-dim group-hover/session:text-brand-primary transition-colors" />
                          ) : (
                            <Globe size={18} className="text-brand-text-dim group-hover/session:text-brand-primary transition-colors" />
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
                          <div className="flex items-center gap-3 text-[9px] font-bold text-brand-text-dim uppercase tracking-widest opacity-60">
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
              </div>

              <div className="p-6 bg-brand-danger/5 rounded-[28px] border border-brand-danger/20">
                <h5 className="text-[10px] font-black text-brand-danger uppercase tracking-[0.2em] mb-2">Safety Tip</h5>
                <p className="text-[10px] font-bold text-brand-danger/60 leading-relaxed">
                  Log out of any unrecognized devices immediately. If you suspect your account is compromised, change your password to revoke all sessions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
