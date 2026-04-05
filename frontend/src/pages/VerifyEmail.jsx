import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { Sparkles, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await authApi.verifyEmail(token);
                if (response.success) {
                    setStatus('success');
                    setMessage(response.message || 'Email verified successfully!');
                } else {
                    setStatus('error');
                    setMessage(response.message || 'Verification failed.');
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || err.message || 'Invalid or expired token.');
            }
        };

        if (token) {
            verify();
        }
    }, [token]);

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-brand-surface rounded-[40px] p-10 border border-brand-border/40 shadow-premium relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16 animate-pulse"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-8 border border-brand-primary/20">
                        <Sparkles size={32} className="text-brand-primary" />
                    </div>

                    {status === 'verifying' && (
                        <div className="space-y-4">
                            <Loader2 size={40} className="text-brand-primary animate-spin mx-auto" />
                            <h2 className="text-xl font-black text-brand-text uppercase tracking-tight">Verifying Identity</h2>
                            <p className="text-xs font-bold text-brand-text-dim uppercase tracking-widest opacity-60">Connecting to secure authentication node...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <CheckCircle size={48} className="text-brand-success mx-auto" />
                            <div>
                                <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight mb-2">Account Activated</h2>
                                <p className="text-[10px] font-black text-brand-success uppercase tracking-[0.2em] mb-4">Verification Successful</p>
                                <p className="text-sm font-medium text-brand-text-dim leading-relaxed">{message}</p>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-text text-brand-bg rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:bg-black transition-all active:scale-95"
                            >
                                Log In to Continue <ArrowRight size={16} />
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <XCircle size={48} className="text-brand-danger mx-auto" />
                            <div>
                                <h2 className="text-2xl font-black text-brand-text uppercase tracking-tight mb-2">Activation Failed</h2>
                                <p className="text-[10px] font-black text-brand-danger uppercase tracking-[0.2em] mb-4">Error Protocol Detected</p>
                                <p className="text-sm font-medium text-brand-text-dim leading-relaxed">{message}</p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <Link
                                    to="/register"
                                    className="block w-full text-center py-4 text-xs font-black text-brand-primary uppercase tracking-[0.15em] hover:opacity-70 transition-opacity"
                                >
                                    Back to Registration
                                </Link>
                                <Link
                                    to="/"
                                    className="block w-full text-center text-[10px] font-bold text-brand-text-dim uppercase tracking-widest hover:text-brand-text transition-colors"
                                >
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
