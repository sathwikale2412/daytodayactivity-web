import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { seedSampleData } from '../db/database';

const DEMO_EMAIL = 'cloudtest@daytoday.app';
const DEMO_PASSWORD = 'TestPass1234';

export default function AuthModal({ isOpen, onClose }) {
  const { login, signup, cloud } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dailyGoalCount, setDailyGoalCount] = useState(5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup({
          email,
          password,
          name: name.trim() || 'User',
          dailyGoalCount: Number(dailyGoalCount) || 5
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueGuest = () => {
    setError('');
    onClose();
  };

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      const signedIn = await login(DEMO_EMAIL, DEMO_PASSWORD);
      await seedSampleData(signedIn.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo sign in failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-dark-surface/95 border border-white/15 p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent-teal flex items-center justify-center text-white shadow-glow-blue">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
              </h3>
              <p className="text-xs text-white/50">Day to Day Activity Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'login' ? 'bg-primary text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'signup' ? 'bg-primary text-white shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Sathwik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Target Daily Goal (Tasks)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={dailyGoalCount}
                onChange={(e) => setDailyGoalCount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-glow-blue transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Reviewer demo: one click into a populated account */}
        {cloud && (
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <p className="text-xs font-semibold text-white/80">Just looking? Use the demo account</p>
            <p className="text-[11px] font-mono text-white/45 break-all">
              {DEMO_EMAIL} &middot; {DEMO_PASSWORD}
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading || demoLoading}
              className="w-full py-2 rounded-xl bg-accent-teal/15 hover:bg-accent-teal/25 border border-accent-teal/30 text-accent-teal text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {demoLoading ? 'Preparing a week of sample data…' : 'Sign in with demo data'}
            </button>
          </div>
        )}

        {/* Guest exploration */}
        <div className="pt-2 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/40 mb-2">
            {cloud ? 'Sign in to sync your data across every device.' : 'Or keep using this device only.'}
          </p>
          <button
            type="button"
            onClick={handleContinueGuest}
            disabled={loading}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent-teal" />
            <span>Continue as Guest (stays on this device)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
