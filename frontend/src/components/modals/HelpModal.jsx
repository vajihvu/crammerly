import React, { useState } from 'react';
import { X, HelpCircle, Search, ChevronRight, MessageSquare, Book, PlayCircle, LifeBuoy, Shield, FileText, Activity, CheckCircle2 } from 'lucide-react';
import { useUI } from '../../context/UIContext';

const helpContent = {
    'Getting Started': [
        {
            q: 'How do I create an account?',
            a: 'Click "Get Started" on the landing page, enter your name, email, and a strong password (10+ characters with uppercase, lowercase, number, and special character). You can also sign up instantly with Google OAuth.'
        },
        {
            q: 'How do I verify my email?',
            a: 'After registering, check your inbox for a verification email from Crammerly. Click the verification link to activate your account. If you don\'t see it, check your spam folder or request a new one from the login page.'
        },
        {
            q: 'How do I set up my profile?',
            a: 'After logging in, open the sidebar menu (☰) and navigate to Settings. From there you can update your display name, upload an avatar, and set your study interests to get personalized room recommendations.'
        },
        {
            q: 'What is a Study Room?',
            a: 'A Study Room is a virtual space where you and others can study together in real-time. Each room has a name, subject/topic, and an optional scheduled start time. Rooms can be Public (anyone can join) or Private (invite-only).'
        },
        {
            q: 'How do I join my first room?',
            a: 'From the dashboard, browse the "Active Now" tab to see live rooms. Click on any room card to join instantly. You can also search for specific subjects using the search bar, or join a private room using an invite code via "Join by Code".'
        },
        {
            q: 'What are the different user statuses?',
            a: 'You can set your status to Online (green — available and active), Do Not Disturb (red — mutes notifications for a set duration), or Offline (gray — appear invisible to others).'
        }
    ],
    'Study Room Guide': [
        {
            q: 'How do I create a room?',
            a: 'Click the "+ Create Room" button on your dashboard. Fill in the room name, your study goal, select a subject from the dropdown, choose Public or Private visibility, and optionally schedule a future date and time. Hit "Create Room" to go live.'
        },
        {
            q: 'What subjects are available?',
            a: 'Crammerly offers 20+ subjects including IT, Law, Math, Medicine, Languages, Coding, Editing, Film Making, Design, Business, Quiet Study, Music, Game Dev, Architecture, Marketing, Exam Prep, Interview Prep, Reading, Brainstorming, Psychology, and History.'
        },
        {
            q: 'How do scheduled rooms work?',
            a: 'When creating a room, select a future date and time. Your room will appear under the "Scheduled" tab on the dashboard. Other users can see it and plan to join. The room becomes active when you or any member starts it at the scheduled time.'
        },
        {
            q: 'What is the difference between Public and Private rooms?',
            a: 'Public rooms are visible to all users and anyone can join directly. Private rooms are hidden from the public listing and require an invite code to join. Use Private rooms for focused group study or exam prep with friends.'
        },
        {
            q: 'How does the chat work inside a room?',
            a: 'Each room has a real-time chat powered by WebSocket connections. Messages appear instantly for all participants. You can share study tips, ask questions, or coordinate break times with your study group.'
        },
        {
            q: 'Can I filter rooms by subject?',
            a: 'Yes! Use the "All Genres" dropdown on the dashboard to filter rooms by any subject. You can also type in the search box within the dropdown to quickly find specific topics.'
        }
    ],
    'Common Issues': [
        {
            q: 'I can\'t log in to my account',
            a: 'First, ensure your email is verified (check your inbox for the verification link). If you\'ve forgotten your password, click "Forgot Password" on the login page to receive a reset link. After 5 failed login attempts, your account is temporarily locked for security — wait 15 minutes and try again.'
        },
        {
            q: 'The app shows "Connection Lost"',
            a: 'This typically means the WebSocket connection to our servers was interrupted. Check your internet connection, then refresh the page. If the issue persists, our servers may be undergoing maintenance — check back in a few minutes.'
        },
        {
            q: 'My scheduled room doesn\'t appear on the dashboard',
            a: 'Make sure you\'re checking the "Scheduled" tab (not "Active Now"). Rooms scheduled for today and future dates appear there. If you just created the room, try refreshing the page to sync the latest data.'
        },
        {
            q: 'I\'m not receiving verification or reset emails',
            a: 'Check your spam/junk folder first. Some email providers may delay delivery. If you still don\'t receive it after 5 minutes, try requesting a new email. Ensure you\'re checking the correct email address associated with your account.'
        },
        {
            q: 'The page looks broken or elements overlap',
            a: 'Try clearing your browser cache and refreshing the page. Crammerly works best on the latest versions of Chrome, Firefox, Safari, and Edge. If you find a persistent UI bug, please report it using the "Report a Bug" option in the sidebar menu.'
        },
        {
            q: 'My study session timer isn\'t tracking correctly',
            a: 'The study timer requires an active browser tab to function properly. If you switch tabs or minimize the browser, tracking may pause. Keep the Crammerly tab active during your study session for accurate time logging.'
        },
        {
            q: 'How do I report a bug?',
            a: 'Open the sidebar menu (☰), scroll to the "Support" section, and click "Report a Bug." Select the type of issue (Look/Design, Broken, or Sound/Video), enter a short title and detailed description, optionally attach a screenshot, and hit Send. Our team reviews reports regularly.'
        }
    ],
    'Community Rules': [
        {
            q: 'Be Respectful',
            a: 'Treat every member with kindness and respect. Harassment, bullying, hate speech, discrimination, or personal attacks of any kind will result in immediate account suspension. We\'re all here to learn and grow together.'
        },
        {
            q: 'Stay On Topic',
            a: 'Use study rooms for their intended purpose. Keep conversations relevant to the room\'s subject. Off-topic discussions distract others who are trying to focus. Use the general chat or create a separate room for casual conversations.'
        },
        {
            q: 'No Spam or Self-Promotion',
            a: 'Do not spam rooms with repetitive messages, advertisements, or unsolicited promotions. Sharing helpful study resources is encouraged, but commercial advertising and link spam are not allowed.'
        },
        {
            q: 'Protect Privacy',
            a: 'Never share another user\'s personal information without their consent. Do not post screenshots of private conversations. Respect everyone\'s right to study in a safe and secure environment.'
        },
        {
            q: 'Academic Integrity',
            a: 'Crammerly is a study aid, not a cheating tool. Do not use rooms to share exam answers, plagiarize content, or violate your institution\'s academic honesty policies. Collaborative learning and discussion are encouraged; dishonesty is not.'
        }
    ],
    'Privacy Policy': [
        {
            q: 'What data does Crammerly collect?',
            a: 'We collect your name, email, and hashed password when you register. If you use Google sign-in, we receive your name, email, and profile picture. We also store data you create: study sessions, to-dos, room memberships, and chat messages. Authentication events (login, logout) are logged for security.'
        },
        {
            q: 'How is my data used?',
            a: 'Your data is used solely to provide the Crammerly service — powering your dashboard, rooms, and study tracking. We send transactional emails (verification, password resets, security alerts). We use anonymous aggregate metrics for product improvement. We do NOT sell your personal data to third parties.'
        },
        {
            q: 'What cookies does Crammerly use?',
            a: 'We use a single HttpOnly session cookie to keep you logged in. This is a strictly necessary cookie under GDPR. We use Plausible Analytics — a privacy-first, cookieless analytics tool — so no tracking cookies are placed on your browser.'
        },
        {
            q: 'How long is my data retained?',
            a: 'Your data is kept as long as your account is active. Security audit logs are automatically deleted after 90 days. You can delete your entire account and all associated data at any time from Settings.'
        },
        {
            q: 'What are my rights under GDPR?',
            a: 'If you\'re in the EU/EEA, you have the right to access, export, correct, and permanently delete your data. Use your Profile Settings to manage these actions, or email privacy@crammerly.app for specific requests.'
        },
        {
            q: 'What third-party services are used?',
            a: 'We use MongoDB Atlas (database hosting), Google OAuth (optional sign-in), Sentry (error monitoring), and Plausible (privacy-first analytics). All sub-processors are GDPR-compliant.'
        }
    ],
    'Terms of Service': [
        {
            q: 'Who can use Crammerly?',
            a: 'You must be at least 13 years old to use Crammerly. If you are under 18, you must have parental consent. By creating an account, you confirm you meet these eligibility requirements.'
        },
        {
            q: 'What is the acceptable use policy?',
            a: 'You agree not to post illegal, harmful, or abusive content; harass other users; attempt to exploit the platform; use automated bots without permission; or share or sell access to your account. Violations may result in immediate suspension.'
        },
        {
            q: 'Who owns the content I create?',
            a: 'You own all content you create on Crammerly (notes, journal entries, study plans). By using the service, you grant us a limited license to store and display your content solely to provide the platform. We never claim ownership of your data.'
        },
        {
            q: 'Is the service guaranteed to be available?',
            a: 'We strive for high availability but do not guarantee uninterrupted service. Scheduled maintenance may occur with advance notice. We are not liable for downtime caused by third-party infrastructure providers.'
        },
        {
            q: 'How can I delete my account?',
            a: 'You may delete your account at any time from your profile settings. Upon deletion, all your data is permanently removed in accordance with our Privacy Policy. We may also terminate accounts that violate these terms.'
        }
    ],
    'System Status': [
        {
            q: 'Current Platform Status',
            a: 'All systems are operational. Frontend (Vercel), Backend API (Render), Database (MongoDB Atlas), and Real-time Chat (WebSocket) services are running normally.'
        },
        {
            q: 'Uptime Guarantee',
            a: 'Crammerly targets 99.5% monthly uptime. Scheduled maintenance windows are typically performed during low-traffic hours (2:00 AM – 4:00 AM UTC) with advance notice posted on our social channels.'
        },
        {
            q: 'How to check if Crammerly is down?',
            a: 'If you experience issues loading the app, first check your internet connection. If the problem persists, it may be a server-side issue. You can reach out to support@crammerly.app for real-time status updates, or check back in a few minutes.'
        },
        {
            q: 'Recent Incidents',
            a: 'No incidents reported in the last 30 days. Our infrastructure is monitored 24/7 with automatic alerting for any performance degradation or downtime events.'
        },
        {
            q: 'Infrastructure Overview',
            a: 'Frontend is hosted on Vercel (global CDN). Backend API runs on Render with auto-scaling. Database is MongoDB Atlas with automated backups. Real-time features use WebSocket connections for instant message delivery.'
        }
    ]
};

function HelpModal({ onClose }) {
    const { addToast } = useUI();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [expandedItem, setExpandedItem] = useState(null);

    const categories = [
        { title: 'Getting Started', icon: <PlayCircle size={20} />, count: helpContent['Getting Started'].length },
        { title: 'Study Room Guide', icon: <Book size={20} />, count: helpContent['Study Room Guide'].length },
        { title: 'Common Issues', icon: <LifeBuoy size={20} />, count: helpContent['Common Issues'].length },
        { title: 'Community Rules', icon: <MessageSquare size={20} />, count: helpContent['Community Rules'].length }
    ];

    const footerCategories = {
        'Privacy': { title: 'Privacy Policy', icon: <Shield size={20} /> },
        'Terms': { title: 'Terms of Service', icon: <FileText size={20} /> },
        'Status': { title: 'System Status', icon: <Activity size={20} /> }
    };

    const getArticles = () => {
        if (!activeCategory) return [];
        return helpContent[activeCategory.title] || [];
    };

    // Search across all categories
    const getSearchResults = () => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        const results = [];
        Object.entries(helpContent).forEach(([category, items]) => {
            items.forEach((item) => {
                if (item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)) {
                    results.push({ ...item, category });
                }
            });
        });
        return results;
    };

    const searchResults = getSearchResults();

    return (
        <div className="fixed inset-0 bg-brand-bg/80 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 z-[1000] animate-in fade-in duration-300" onClick={onClose}>
            <div
                className="bg-brand-surface sm:rounded-[32px] w-full max-w-xl h-full sm:h-auto sm:max-h-[85vh] border-0 sm:border border-brand-border/30 shadow-2xl animate-in zoom-in-95 duration-500 relative flex flex-col font-sans overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="p-5 md:p-8 pb-3 flex justify-between items-start shrink-0">
                    <div className="flex-1 flex flex-col items-center">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-3 border border-brand-primary/20">
                            <HelpCircle size={24} className="text-brand-primary w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-[1000] text-brand-text tracking-tighter uppercase mb-1.5 leading-none text-center">Help Center</h2>
                        <p className="text-[9px] md:text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] opacity-80 text-center">We are here to help you</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all shadow-md border border-brand-border/30 absolute top-5 right-5 sm:top-6 sm:right-6"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-5 md:px-8">
                    {activeCategory ? (
                        <div className="animate-in slide-in-from-right-4 duration-300 pb-8 mt-2">
                            <button onClick={() => { setActiveCategory(null); setExpandedItem(null); }} className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest mb-6 hover:text-brand-text transition-colors">
                                <ChevronRight className="rotate-180" size={14} /> Back to Help Center
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="text-brand-primary">{activeCategory.icon}</div>
                                <h3 className="text-lg md:text-xl font-[1000] text-brand-text tracking-tighter uppercase leading-none">{activeCategory.title}</h3>
                            </div>
                            <div className="space-y-2">
                                {getArticles().map((item, idx) => (
                                    <div key={idx} className="bg-brand-bg/30 rounded-2xl border border-brand-border/20 overflow-hidden transition-all">
                                        <button
                                            onClick={() => setExpandedItem(expandedItem === idx ? null : idx)}
                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-brand-bg/50 transition-colors"
                                        >
                                            <span className="text-xs md:text-sm font-bold text-brand-text pr-4">{item.q}</span>
                                            <ChevronRight size={16} className={`text-brand-muted shrink-0 transition-transform duration-300 ${expandedItem === idx ? 'rotate-90' : ''}`} />
                                        </button>
                                        {expandedItem === idx && (
                                            <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                                                <p className="text-xs text-brand-text-dim font-medium leading-relaxed">{item.a}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            <div className="relative mb-6 md:mb-8 pt-2">
                                <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for help..."
                                    className="w-full pl-10 md:pl-12 pr-5 py-3 bg-brand-bg border border-brand-border rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary placeholder:text-brand-muted transition-all"
                                />
                            </div>

                            {/* Search Results */}
                            {searchQuery.trim() ? (
                                <div className="pb-8">
                                    {searchResults.length > 0 ? (
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-brand-primary uppercase tracking-widest mb-4 px-1">
                                                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                                            </p>
                                            {searchResults.map((item, idx) => (
                                                <div key={idx} className="bg-brand-bg/30 rounded-2xl border border-brand-border/20 overflow-hidden">
                                                    <button
                                                        onClick={() => setExpandedItem(expandedItem === `s-${idx}` ? null : `s-${idx}`)}
                                                        className="w-full flex items-start justify-between p-4 text-left hover:bg-brand-bg/50 transition-colors"
                                                    >
                                                        <div className="pr-4">
                                                            <span className="text-xs md:text-sm font-bold text-brand-text block">{item.q}</span>
                                                            <span className="text-[9px] font-bold text-brand-primary/60 uppercase tracking-widest mt-1 block">{item.category}</span>
                                                        </div>
                                                        <ChevronRight size={16} className={`text-brand-muted shrink-0 mt-0.5 transition-transform duration-300 ${expandedItem === `s-${idx}` ? 'rotate-90' : ''}`} />
                                                    </button>
                                                    {expandedItem === `s-${idx}` && (
                                                        <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                                                            <p className="text-xs text-brand-text-dim font-medium leading-relaxed">{item.a}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="col-span-1 md:col-span-2 text-center py-10 bg-brand-bg/20 rounded-[24px] border border-brand-border/10">
                                            <p className="text-brand-text-dim font-black text-[10px] md:text-xs uppercase tracking-widest">No articles found for &quot;{searchQuery}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                                    {categories.map((cat, i) => (
                                        <button key={i} onClick={() => { setActiveCategory(cat); setExpandedItem(null); }} className="flex items-center justify-between p-3 md:p-4 bg-brand-bg/40 hover:bg-brand-bg rounded-[20px] md:rounded-2xl border border-brand-border/20 hover:border-brand-primary group transition-all text-left">
                                            <div className="flex items-center gap-3">
                                                <div className="text-brand-primary group-hover:scale-110 transition-transform shrink-0">{cat.icon}</div>
                                                <div className="min-w-0">
                                                    <p className="text-xs md:text-sm font-black text-brand-text uppercase tracking-tight leading-none truncate">{cat.title}</p>
                                                    <p className="text-[9px] font-bold text-brand-text-dim mt-1 uppercase tracking-widest">{cat.count} ARTICLES</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-brand-muted group-hover:text-brand-primary transition-colors shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Fixed Footer */}
                <div className="p-5 md:px-8 md:py-6 border-t border-brand-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-brand-surface">
                    <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Need more help?</p>
                        <p className="text-[9px] font-medium text-brand-text-dim mt-0.5 uppercase tracking-widest">We usually reply within 2 hours.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-4 text-[9px] font-semibold text-brand-text-dim uppercase tracking-widest">
                            <button onClick={() => { setActiveCategory(footerCategories['Privacy']); setExpandedItem(null); }} className="hover:text-brand-text transition-colors uppercase tracking-widest text-[9px]">Privacy</button>
                            <button onClick={() => { setActiveCategory(footerCategories['Terms']); setExpandedItem(null); }} className="hover:text-brand-text transition-colors uppercase tracking-widest text-[9px]">Terms</button>
                            <button onClick={() => { setActiveCategory(footerCategories['Status']); setExpandedItem(null); }} className="hover:text-brand-text transition-colors uppercase tracking-widest text-[9px]">Status</button>
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                window.open("mailto:support@crammerly.app?subject=Crammerly%20Support%20Request&body=Hi%20Crammerly%20Team%2C%0A%0AI%20need%20help%20with%3A%0A%0A", '_blank');
                                navigator.clipboard.writeText('support@crammerly.app').then(() => {
                                    addToast('Email address copied to clipboard!', 'success');
                                }).catch(() => {
                                    addToast('Opening email client...', 'info');
                                });
                            }}
                            className="px-6 py-2.5 bg-brand-text text-brand-bg rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                            Email Us
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HelpModal;
