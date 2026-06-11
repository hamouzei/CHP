'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';
import {
  Settings,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Mail,
  Building2,
  XCircle,
} from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SettingsPage() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();

  // Profile form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const allRulesPass = PASSWORD_RULES.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'assessor': return 'Assessor';
      case 'reviewer': return 'Reviewer';
      default: return 'Viewer';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
      case 'admin': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
      case 'assessor': return 'bg-[#0072BC]/10 border-[#0072BC]/25 text-[#0072BC]/80';
      case 'reviewer': return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300';
      default: return 'bg-white/05 border-white/10 text-white/70';
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (fullName.length < 2) {
      setProfileError('Full name must be at least 2 characters');
      return;
    }

    setProfileLoading(true);
    try {
      const updated = await api.patch('/users/profile', { fullName });
      // Update the Zustand store with new name
      if (user && accessToken && refreshToken) {
        setAuth({ ...user, fullName: updated.fullName }, accessToken, refreshToken);
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!allRulesPass) {
      setPasswordError('Password does not meet all requirements');
      return;
    }
    if (!passwordsMatch) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.patch('/users/profile', { password: newPassword });
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      if (err.data?.error === 'PASSWORD_REUSE') {
        setPasswordError('New password cannot be the same as your current password.');
      } else {
        setPasswordError(err.message || 'Failed to update password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#0072BC]/10 blur-3xl -z-10" />
        <div className="flex items-center gap-3 mb-1">
          <Settings className="h-5 w-5 text-[#0072BC]" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Account Settings
          </h1>
        </div>
        <p className="text-sm text-white/50">
          Manage your profile information and security settings.
        </p>
      </div>

      {/* Profile Info Card (Read-only) */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> Account Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-xl bg-[#003366]/30 border border-white/10/40">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Email</div>
            <div className="text-sm text-white font-medium flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-white/40" />
              {user.email}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#003366]/30 border border-white/10/40">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Role</div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeColor(user.role)}`}>
              <Shield className="h-3 w-3" />
              {getRoleLabel(user.role)}
            </span>
          </div>
          {user.organizationName && (
            <div className="p-3 rounded-xl bg-[#003366]/30 border border-white/10/40 sm:col-span-2">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Organization</div>
              <div className="text-sm text-white font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-white/40" />
                {user.organizationName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <User className="h-4 w-4" /> Edit Profile
        </h2>

        {profileSuccess && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Profile updated successfully
          </div>
        )}
        {profileError && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4" /> {profileError}
          </div>
        )}

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="glass-input px-4 py-2.5 rounded-xl w-full text-sm"
              placeholder="Your full name"
              required
              minLength={2}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileLoading || fullName === user.fullName}
              className="py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#0072BC] to-[#0072BC]/80 hover:from-[#005a94] hover:to-[#0072BC] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4" /> Change Password
        </h2>

        {passwordSuccess && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Password changed successfully
          </div>
        )}
        {passwordError && (
          <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4" /> {passwordError}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="glass-input px-4 pr-11 py-2.5 rounded-xl w-full text-sm"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Password rules */}
          {newPassword.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#003366]/40 border border-white/08">
              {PASSWORD_RULES.map((rule) => {
                const passes = rule.test(newPassword);
                return (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    {passes ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className={passes ? 'text-emerald-400' : 'text-red-400'}>{rule.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`glass-input px-4 pr-11 py-2.5 rounded-xl w-full text-sm ${
                  confirmPassword.length > 0 && !passwordsMatch ? 'border-red-500/40' : ''
                }`}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading || !allRulesPass || !passwordsMatch}
              className="py-2.5 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
