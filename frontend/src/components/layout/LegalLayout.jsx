import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const LegalLayout = ({ title, lastUpdated, children }) => (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-12">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Crammerly
            </Link>

            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
                    <Shield className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Legal</span>
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{title}</h1>
            <p className="text-slate-500 text-sm mb-10">Last updated: {lastUpdated}</p>

            <div className="prose prose-invert prose-slate max-w-none space-y-6 text-slate-300 leading-relaxed">
                {children}
            </div>

            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <span>© {new Date().getFullYear()} Crammerly. All rights reserved.</span>
                <div className="flex gap-6">
                    <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    <a href="mailto:support@crammerly.app" className="hover:text-white transition-colors">Support</a>
                </div>
            </div>
        </div>
    </div>
);

export default LegalLayout;
