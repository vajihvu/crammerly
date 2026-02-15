import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import PasswordStrengthMeter from '../auth/PasswordStrengthMeter';

function AuthModal({ onClose, onGoogleLogin }) {
  const { login, register } = useAuth();
  const { addToast } = useUI();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (isSignUp) {
        await register({ name, email, password });
        setSuccess(true);
        addToast('Account created successfully!', 'success');
      } else {
        await login(email, password);
        addToast('Successfully authenticated!', 'success');
      }
    } catch (err) {
      if (err.status === 429 || err.message?.includes('rate limit')) {
        setError('Security System: Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, Supabase google login is still handled in Crammer.jsx via onGoogleLogin prop
      // or we could migrate it to authApi/AuthContext
      await onGoogleLogin();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-3xl flex items-center justify-center p-4 z-[500] animate-in fade-in duration-500" onClick={onClose}>
      <div
        className="bg-brand-surface rounded-[40px] p-8 sm:p-10 max-w-md w-full border border-brand-border/40 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-500 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16 animate-pulse pointer-events-none"></div>

        <div className="flex flex-col items-center relative z-10">
          <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center mb-6 shadow-premium transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <Sparkles size={28} className="text-white" />
          </div>

          <h3 className="text-2xl font-black text-brand-text uppercase tracking-tighter mb-1">
            {isSignUp ? 'Create ' : 'Access '}<span className="text-brand-primary">HUB</span>
          </h3>
          <p className="text-[9px] font-black text-brand-text-dim uppercase tracking-[0.2em] mb-8 opacity-60">
            {isSignUp ? 'Join the decentralized network' : 'Authorize to enter the network'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4 mb-6">
            <div className="space-y-3">
              {isSignUp && (
                <div className="relative group animate-in slide-in-from-top-2 duration-300">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-brand-bg border border-brand-border/50 rounded-2xl text-sm font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                    required
                  />
                </div>
              )}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-brand-bg border border-brand-border/50 rounded-2xl text-sm font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Secret Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-brand-bg border border-brand-border/50 rounded-2xl text-sm font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                  required
                />
              </div>
              {isSignUp && password && (
                <PasswordStrengthMeter password={password} userInputs={[name, email]} />
              )}
            </div>

            {error && <p className="text-[10px] font-bold text-brand-danger uppercase tracking-wider text-center bg-brand-danger/10 p-3 rounded-xl border border-brand-danger/20">{error}</p>}
            {success && <p className="text-[10px] font-bold text-brand-success uppercase tracking-wider text-center bg-brand-success/10 p-3 rounded-xl border border-brand-success/20">Registration successful! Please check your email inbox to confirm your account.</p>}

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-text text-brand-bg rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Register Account' : 'Authenticate')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div className="w-full flex items-center gap-4 mb-6">
            <div className="h-[1px] flex-1 bg-brand-border/30"></div>
            <span className="text-[9px] font-black text-brand-text-dim uppercase tracking-widest opacity-40">OR</span>
            <div className="h-[1px] flex-1 bg-brand-border/30"></div>
          </div>

          <button
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-white border border-brand-border text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-brand-bg active:scale-95 group disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            {loading ? 'Initiating...' : 'Continue with Google'}
          </button>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-8 py-2 text-xs font-black text-brand-primary uppercase tracking-[0.15em] hover:opacity-70 transition-opacity w-full text-center"
          >
            {isSignUp ? 'Already have credentials? Log In' : 'Need authorization? Create Account'}
          </button>

          {!isSignUp && (
            <button
              onClick={() => {
                onClose();
                // Navigate to forgot password using window.location or we could use Link/useNavigate
                // but since this is a modal that might be used anywhere, 
                // and we're inside the context of Router, window.location is a safe bet for quick exit.
                // Better: navigate via prop or just window.location.href
                window.location.href = '/forgot-password';
              }}
              className="mt-2 py-2 text-[10px] font-bold text-brand-text-dim uppercase tracking-widest hover:text-brand-primary transition-colors w-full text-center"
            >
              Forgot Secret Credentials?
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 p-2.5 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all z-50 border border-brand-border/30 shadow-md"
          title="Close"
        >
          <X size={20} />
        </button>

      </div>
    </div>
  );
}

export default AuthModal;
