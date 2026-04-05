import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Turnstile } from '@marsidev/react-turnstile';
import { X, Sparkles, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import PasswordStrengthMeter from '../auth/PasswordStrengthMeter';

function AuthModal({ onClose, closable = true }) {
  const { login, register, googleLogin, verify2FA } = useAuth();
  const { addToast } = useUI();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [success, setSuccess] = useState(false);
  
  const [isTwoFactorMode, setIsTwoFactorMode] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (isSignUp) {
        await register({ name, email, password, 'cf-turnstile-response': turnstileToken });
        setSuccess(true);
        addToast('Account created successfully!', 'success');
      } else {
        if (!isTwoFactorMode) {
            const res = await login(email, password);
            if (res.requiresTwoFactor) {
                setIsTwoFactorMode(true);
                setTempToken(res.tempToken);
                setLoading(false);
                return;
            }
            addToast('Successfully authenticated!', 'success');
            onClose();
        } else {
            await verify2FA(tempToken, twoFactorCode);
            addToast('Login Confirmed!', 'success');
            onClose();
        }
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

  return (
    <div className="fixed inset-0 bg-brand-bg/95 backdrop-blur-3xl flex items-center justify-center p-4 z-[500] animate-in fade-in duration-500" onClick={closable ? onClose : undefined}>
      <div
        className="bg-brand-surface rounded-[28px] p-5 sm:p-6 max-w-[340px] w-full border border-brand-border/40 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in zoom-in-95 duration-500 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-2xl -mr-16 -mt-16 animate-pulse pointer-events-none"></div>

        <div className="flex flex-col items-center relative z-10">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center mb-3 shadow-premium transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <Sparkles size={20} className="text-white" />
          </div>

          {/* ── Post-Registration: Check Your Email ── */}
          {success ? (
            <div className="w-full text-center animate-in zoom-in-95 duration-500 space-y-4">
              <div className="w-14 h-14 mx-auto bg-brand-success/10 rounded-2xl flex items-center justify-center border border-brand-success/20">
                <Mail size={28} className="text-brand-success" />
              </div>
              <h3 className="text-lg font-bold text-brand-text">Check Your Email</h3>
              <p className="text-xs text-brand-text-dim leading-relaxed">
                We've sent a verification link to<br />
                <span className="font-bold text-brand-text">{email}</span>
              </p>
              <p className="text-[10px] text-brand-text-dim opacity-70 leading-relaxed">
                Open the link in your email to activate your account. Once verified, you'll be able to log in and set up your profile.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => { setSuccess(false); setIsSignUp(false); }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-text text-brand-bg rounded-xl font-bold text-xs shadow-premium hover:bg-black transition-all active:scale-95"
                >
                  Back to Log In <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
          <>
          <h3 className="text-lg font-bold text-brand-text mb-1">
            {isTwoFactorMode ? 'Authentication Required' : isSignUp ? 'Create Account' : 'Welcome Back'}
          </h3>
          <p className="text-xs text-brand-text-dim mb-4 text-center">
            {isTwoFactorMode ? 'Enter the 6-digit code from your authenticator' : isSignUp ? 'Sign up to get started' : 'Log in to your account'}
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-3 mb-4">
            <div className="space-y-3">
              {isTwoFactorMode ? (
                  <div className="relative group animate-in slide-in-from-right-4 duration-300">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="6-Digit OTP Code"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all tracking-widest text-center"
                      required
                    />
                  </div>
              ) : (
                <>
              {isSignUp && (
                <div className="relative group animate-in slide-in-from-top-2 duration-300">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
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
                  className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                  required
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-dim group-focus-within:text-brand-primary transition-colors" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-5 py-2.5 bg-brand-bg border border-brand-border/50 rounded-[14px] text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none transition-all"
                  required
                />
              </div>
              {isSignUp && password && (
                <PasswordStrengthMeter password={password} userInputs={[name, email]} />
              )}
              {isSignUp && (
                <div className="flex justify-center mt-2 w-full overflow-hidden">
                  <Turnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                    onSuccess={(token) => setTurnstileToken(token)}
                    options={{ theme: 'dark', size: 'normal' }}
                  />
                </div>
              )}
             </>
            )}
            </div>

            {error && <p className="text-[10px] font-bold text-brand-danger uppercase tracking-wider text-center bg-brand-danger/10 p-3 rounded-xl border border-brand-danger/20">{error}</p>}

            <button
              type="submit"
              disabled={loading || (isTwoFactorMode && twoFactorCode.length !== 6)}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 mt-3 bg-brand-text text-brand-bg rounded-xl font-bold text-xs shadow-premium hover:bg-black transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isTwoFactorMode ? 'Verify' : (isSignUp ? 'Sign Up' : 'Log In')}
              {!loading && <ArrowRight size={14} />}
            </button>
          </form>

          <div className="w-full flex items-center gap-4 mb-4">
            <div className="h-[1px] flex-1 bg-brand-border/30"></div>
            <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest opacity-60">OR</span>
            <div className="h-[1px] flex-1 bg-brand-border/30"></div>
          </div>

          <div className="w-full flex justify-center mt-2">
            <GoogleLogin
              onSuccess={credentialResponse => {
                setLoading(true);
                googleLogin(credentialResponse.credential)
                  .then(() => {
                    addToast('Successfully authenticated with Google!', 'success');
                    onClose();
                  })
                  .catch(err => {
                    setError(err.message || 'Google authentication failed.');
                    setLoading(false);
                  });
              }}
              onError={() => {
                setError('Google Login Failed');
              }}
              useOneTap
            />
          </div>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="mt-5 py-1 text-xs font-semibold text-brand-primary hover:opacity-70 transition-opacity w-full text-center"
          >
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>

          {!isSignUp && (
            <button
              onClick={() => {
                onClose();
                window.location.href = '/forgot-password';
              }}
              className="mt-0.5 py-1 text-xs font-medium text-brand-text-dim hover:text-brand-primary transition-colors w-full text-center"
            >
              Forgot Password?
            </button>
          )}
          </>
          )}
        </div>

        {closable && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 text-brand-text-dim hover:text-brand-text bg-brand-bg hover:bg-brand-muted/20 rounded-full transition-all z-50 border border-brand-border/30 shadow-md"
            title="Close"
          >
            <X size={16} />
          </button>
        )}

      </div>
    </div>
  );
}

export default AuthModal;
