// src/components/modals/ProfileModal.jsx
import React, { useState } from 'react';
import { X, Plus, CheckCircle, Github, Linkedin, Briefcase, GraduationCap, UserCircle, Camera, Share2, Copy, Check, Shield, Globe } from 'lucide-react';




function ProfileModal({ currentUser = {}, onClose, onUpdateProfile }) {
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
  const fileInputRef = React.useRef(null);

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
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-premium shrink-0 ${isEditing
                  ? 'bg-brand-primary text-brand-bg'
                  : 'bg-brand-text text-brand-bg hover:bg-brand-text/90'
                  }`}
              >
                {isEditing ? 'Save' : 'Edit'}
              </button>
              <button onClick={onClose} className="p-1.5 sm:p-2 text-brand-text-dim hover:text-brand-danger hover:bg-brand-bg rounded-full transition-all shrink-0">
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
          {/* Enhanced Identity Section with Banner */}
              <div className="relative rounded-[32px] overflow-hidden border border-brand-border/80 shadow-premium bg-brand-surface">
                <div className="px-6 py-6 flex flex-col sm:flex-row items-center sm:items-center gap-5 relative z-10 text-center sm:text-left">
                  <div
                    className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg shrink-0 relative overflow-hidden group/pfp bg-brand-surface ${isEditing ? 'cursor-pointer' : ''}`}
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
              </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileModal;
