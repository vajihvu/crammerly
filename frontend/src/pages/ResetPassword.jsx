import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { Sparkles, Key, Lock, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import PasswordStrengthMeter from '../components/auth/PasswordStrengthMeter';
import { useUI } from '../context/UIContext';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { addToast } = useUI();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            addToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        setStatus('idle');

        try {
            const response = await authApi.resetPassword(token, password);
            if (response.success) {
                setStatus('success');
                setMessage(response.message);
                addToast('Password reset successfully', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.message || err.message || 'Failed to reset password.');
            addToast(err.response?.data?.message || err.message, 'error');
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
                            <Key size={32} className="text-brand-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight">Security Gateway</h2>
                        <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mt-1">Credential Overhaul</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                            <CheckCircle size={48} className="text-brand-success mx-auto" />
                            <div>
                                <h3 className="text-xl font-black text-brand-text uppercase tracking-tight mb-2">Vault Synchronized</h3>
                                <p className="text-sm font-medium text-brand-text-dim leading-relaxed">{message}</p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-text text-brand-bg rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:bg-black transition-all active:scale-95"
                            >
                                Authenticate Now <ArrowRight size={16} />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest pl-1">New Secret Access</label>
                                    <div className="relative group">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full pl-12 pr-6 py-4 bg-brand-bg border border-brand-border/50 rounded-2xl text-sm font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <PasswordStrengthMeter password={password} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest pl-1">Confirm Secret</label>
                                    <div className="relative group">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            className="w-full pl-12 pr-6 py-4 bg-brand-bg border border-brand-border/50 rounded-2xl text-sm font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="p-4 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl flex items-start gap-3">
                                    <XCircle size={18} className="text-brand-danger shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-brand-danger leading-relaxed">{message}</p>
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
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Reset Credentials <ArrowRight size={16} />
                                    </>
                                )}
                            </button>

                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="text-[10px] font-black text-brand-text-dim uppercase tracking-widest hover:text-brand-primary transition-colors"
                                >
                                    Cancel & Return
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
