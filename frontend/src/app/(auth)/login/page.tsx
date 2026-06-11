'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, isLoading: authLoading, user: authUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // If already authenticated, redirect based on role
  useEffect(() => {
    if (isAuthenticated && authUser) {
      if (authUser.role === 'super_admin' || authUser.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/assessments');
      }
    }
  }, [isAuthenticated, authUser, router]);

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
      
      // Redirect based on role
      if (data.user.role === 'super_admin' || data.user.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/assessments');
      }
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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#0072BC]/10 rounded-2xl border border-[#0072BC]/20 mb-4 group hover:border-[#0072BC]/40 transition-all duration-300">
            <Shield className="h-10 w-10 text-[#0072BC] group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            CHP Maturity Platform
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Community Health Program Maturity Index Assessment Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0072BC] to-[#0096c7] rounded-t-2xl"></div>

          {/* Locked out alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
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
                  className={`glass-input pl-11 pr-4 py-3 rounded-xl w-full text-sm block ${
                    validationErrors.email ? 'border-red-400 focus:border-red-500' : ''
                  }`}
                  placeholder="name@organization.org"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1.5 text-xs text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#0072BC] hover:text-[#005a94] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
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
                  className={`glass-input pl-11 pr-11 py-3 rounded-xl w-full text-sm block ${
                    validationErrors.password ? 'border-red-400 focus:border-red-500' : ''
                  }`}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1.5 text-xs text-red-500">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#0072BC] hover:bg-[#005a94] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0072BC] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
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

        </div>
      </div>
    </main>
  );
}
