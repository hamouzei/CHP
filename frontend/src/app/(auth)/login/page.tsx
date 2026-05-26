'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, isLoading: authLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Invalid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else {
      // We will let backend handle password complexity strictness, but we can do a basic check
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      
      // Store in Zustand
      setAuth(data.user, data.accessToken, data.refreshToken);
      
      // Redirect
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.status === 403 && err.data?.error === 'LOCKED') {
        setError(err.message || 'Account temporarily locked. Please try again in 30 minutes.');
      } else if (err.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'An error occurred during login. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden aurora-bg animate-aurora py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse-slow"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3.5 bg-violet-600/10 rounded-2xl border border-violet-500/20 shadow-lg shadow-violet-500/5 mb-4 group hover:border-violet-500/40 transition-all duration-300">
            <Shield className="h-10 w-10 text-violet-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent">
            CHP Maturity Platform
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Community Health Program Maturity Index Assessment Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent"></div>

          {/* Locked out alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm animate-shake">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`glass-input pl-11 pr-4 py-3 rounded-2xl w-full text-sm block ${
                    validationErrors.email ? 'border-red-500/40 focus:border-red-500' : ''
                  }`}
                  placeholder="name@organization.org"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1.5 text-xs text-red-400">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`glass-input pl-11 pr-11 py-3 rounded-2xl w-full text-sm block ${
                    validationErrors.password ? 'border-red-500/40 focus:border-red-500' : ''
                  }`}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1.5 text-xs text-red-400">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Quick seeded users references for user testing */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Seed Accounts for Testing:</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-violet-300 block">Assessor:</span>
                <span>assessor@chpmi.org</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-cyan-300 block">Reviewer:</span>
                <span>reviewer@chpmi.org</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 mt-1 col-span-2">
                <span className="font-bold text-emerald-300 block">Super Admin:</span>
                <span>superadmin@chpmi.org</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
