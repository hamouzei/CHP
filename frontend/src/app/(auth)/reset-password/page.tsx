'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../services/api';
import { Shield, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft, XCircle } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allRulesPass && passwordsMatch && !!token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (!allRulesPass) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      if (err.data?.error === 'INVALID_TOKEN') {
        setError('Reset link has expired or is invalid. Please request a new one.');
      } else if (err.data?.error === 'PASSWORD_REUSE') {
        setError('New password cannot be the same as your current password.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full relative z-10">
          <div className="glass-card rounded-2xl p-8 sm:p-10 shadow-lg text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-gray-500 mb-6">
              This password reset link is missing or invalid. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-[#0072BC] hover:bg-[#005a94] transition-all"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3.5 bg-[#0072BC]/10 rounded-2xl border border-[#0072BC]/20 mb-4">
            <Shield className="h-10 w-10 text-[#0072BC]" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Choose a strong password that meets all the requirements below.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#0072BC] to-[#0096c7] rounded-t-2xl"></div>

          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-2xl border border-emerald-200 mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold text-white bg-[#0072BC] hover:bg-[#005a94] transition-all active:scale-[0.98]"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* New Password */}
                <div>
                  <label htmlFor="reset-password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input pl-11 pr-11 py-3 rounded-xl w-full text-sm block"
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
                </div>

                {/* Password Rules Checklist */}
                <div className="space-y-1.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  {PASSWORD_RULES.map((rule) => {
                    const passes = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2 text-xs">
                        {password.length === 0 ? (
                          <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                        ) : passes ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className={password.length === 0 ? 'text-gray-400' : passes ? 'text-emerald-600' : 'text-red-500'}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`glass-input pl-11 pr-11 py-3 rounded-xl w-full text-sm block ${
                        confirmPassword.length > 0 && !passwordsMatch ? 'border-red-400' : ''
                      }`}
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-[#0072BC] hover:bg-[#005a94] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0072BC] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#0072BC] hover:text-[#005a94] transition-colors font-medium"
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

// Next.js 16 requires useSearchParams to be in a Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-[#0072BC] animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
