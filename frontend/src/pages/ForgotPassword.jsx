import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { Sparkles, Mail, ArrowRight, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useUI } from '../context/UIContext';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { addToast } = useUI();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await authApi.forgotPassword(email);
            if (response.success) {
                setSubmitted(true);
                addToast('Reset instructions sent to your email', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to request reset.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-brand-surface rounded-[40px] p-10 border border-brand-border/40 shadow-premium relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16 animate-pulse"></div>

                <div className="relative z-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-brand-primary/20">
                            <Mail size={32} className="text-brand-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight text-center">Identity Recovery</h2>
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mt-1">Encrypted Link Generation</p>
                    </div>

                    {submitted ? (
                        <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                            <CheckCircle size={48} className="text-brand-success mx-auto" />
                            <div>
                                <h3 className="text-xl font-black text-brand-text uppercase tracking-tight mb-2">Request Processed</h3>
                                <p className="text-sm font-medium text-brand-text-dim leading-relaxed">
                                    If an account exists for <span className="text-brand-text font-bold">{email}</span>,
                                    security parameters have been sent. Please check your secure inbox.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-text text-brand-bg rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:bg-black transition-all active:scale-95"
                                >
                                    Return to Login <ArrowRight size={16} />
                                </button>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest hover:text-brand-primary transition-colors"
                                >
                                    Try a different email
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <p className="text-sm text-brand-text-dim text-center mb-2">
                                Enter your registered credentials to initiate the secure password reset protocol.
                            </p>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest pl-1">Primary Email Node</label>
                                <div className="relative group">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="user@network.com"
                                        className="w-full pl-12 pr-6 py-4 bg-brand-bg border border-brand-border/50 rounded-2xl text-sm font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl">
                                    <p className="text-xs font-bold text-brand-danger leading-relaxed">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-text text-brand-bg rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Transmitting...
                                    </>
                                ) : (
                                    <>
                                        Generate Recovery Link <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 text-[10px] font-black text-brand-text-dim uppercase tracking-widest hover:text-brand-primary transition-colors"
                                >
                                    <ArrowLeft size={12} /> Back to Credentials
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
