'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../services/api';
import { Shield, Mail, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      // Still show success to prevent user enumeration (backend also returns 200)
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden aurora-bg animate-aurora py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse-slow"></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-lg shadow-blue-500/5 mb-4 group hover:border-blue-500/40 transition-all duration-300">
            <Shield className="h-10 w-10 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email address and we&apos;ll send you a password reset link.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>

          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-600/10 rounded-2xl border border-emerald-500/20 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Check Your Email</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                If an account exists with <span className="font-semibold text-slate-300">{email}</span>, a password reset link has been sent. Please check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input pl-11 pr-4 py-3 rounded-2xl w-full text-sm block"
                      placeholder="name@organization.org"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
