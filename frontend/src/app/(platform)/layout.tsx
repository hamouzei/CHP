'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  Bell,
  CheckCircle,
  HelpCircle,
  Activity,
  FolderLock
} from 'lucide-react';
import Link from 'next/link';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('online');

  // Auth Guard
  useEffect(() => {
    // Wait until hydration finishes (isLoading is false)
    const stored = useAuthStore.getState();
    if (!stored.isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.get('/health');
        setApiStatus('online');
      } catch (err) {
        setApiStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // check every 30s
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 text-violet-500 animate-spin border-2 border-violet-500 border-t-transparent rounded-full"></div>
          <span className="text-sm text-slate-400">Loading session...</span>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300';
      case 'assessor':
        return 'bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30 text-violet-300';
      case 'reviewer':
        return 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300';
      default:
        return 'bg-slate-800/80 border border-slate-700/80 text-slate-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'assessor':
        return 'Assessor';
      case 'reviewer':
        return 'Reviewer';
      default:
        return 'Viewer';
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Assessments', href: '/assessments', icon: ClipboardList },
  ];

  // Add Admin Users panel for super admin
  if (user.role === 'super_admin') {
    navigation.push({ name: 'User Directory', href: '/users', icon: Users });
  }

  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Home';
    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('  /  ');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans relative">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.03),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.02),transparent_50%)] pointer-events-none"></div>

      {/* --- Sidebar Desktop --- */}
      <aside
        className={`hidden md:flex flex-col shrink-0 glass-panel border-r border-slate-900 transition-all duration-300 relative z-30 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-violet-600/10 rounded-xl border border-violet-500/20">
              <Shield className="h-5 w-5 text-violet-400" />
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-violet-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent truncate">
                CHP Maturity
              </span>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/20 text-violet-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-slate-900/60">
          {sidebarOpen ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
                <div className="h-9 w-9 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold border border-violet-500/20">
                  {user.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-200 truncate">{user.fullName}</span>
                  <span className="block text-[10px] text-slate-400 truncate">{user.organizationName || 'No Org'}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-500/10 hover:border-red-500/20 transition-all active:scale-[0.98]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* --- Main Wrapper --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* --- Header --- */}
        <header className="h-16 shrink-0 glass-panel border-b border-slate-900 flex items-center justify-between px-4 sm:px-6 relative z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 md:hidden transition-colors"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            
            {/* Breadcrumb info */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* API Status Connection Indicator */}
            <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/80 px-3 py-1.5 rounded-full text-[10px] font-bold">
              <div className={`h-1.5 w-1.5 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className={apiStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}>
                API: {apiStatus === 'online' ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Role Badge */}
            <div className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider ${getRoleBadgeStyles(user.role)}`}>
              {getRoleLabel(user.role)}
            </div>

            {/* User Profile dropdown desktop */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
              >
                <div className="h-8 w-8 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm">
                  {user.fullName.charAt(0)}
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl p-4 shadow-xl border border-slate-800/80 z-40 animate-fade-in">
                    <div className="mb-3 pb-3 border-b border-slate-800/80">
                      <span className="block text-xs font-bold text-slate-200">{user.fullName}</span>
                      <span className="block text-[10px] text-slate-500 truncate mt-0.5">{user.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full text-left py-2 px-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* --- Main Content Area --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* --- Mobile Sidebar Overlay --- */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="fixed inset-y-0 left-0 w-64 glass-panel border-r border-slate-900/60 z-50 flex flex-col md:hidden">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900/60">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-violet-400" />
                <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text text-transparent">
                  CHP Maturity
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/20 text-violet-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-900/60 space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50">
                <div className="h-8 w-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold border border-violet-500/20">
                  {user.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-slate-200 truncate">{user.fullName}</span>
                  <span className="block text-[10px] text-slate-500 truncate">{user.organizationName || 'No Org'}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-500/10 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
