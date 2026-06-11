'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
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
  Building2,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/services/api';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, clearAuth, isLoading, originalUser, stopImpersonation } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Auth Guard
  useEffect(() => {
    // Wait until hydration finishes (isLoading is false)
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);


  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 text-[#0072BC] animate-spin border-2 border-[#0072BC] border-t-transparent rounded-full"></div>
          <span className="text-sm text-gray-500">Loading session...</span>
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
        return 'bg-amber-50 border border-amber-200 text-amber-700';
      case 'admin':
        return 'bg-emerald-50 border border-emerald-200 text-emerald-700';
      case 'assessor':
        return 'bg-blue-50 border border-blue-200 text-[#0072BC]';
      case 'reviewer':
        return 'bg-cyan-50 border border-cyan-200 text-cyan-700';
      default:
        return 'bg-gray-100 border border-gray-200 text-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'assessor':
        return 'Assessor';
      case 'reviewer':
        return 'Reviewer';
      default:
        return 'Viewer';
    }
  };

  const navigation: { name: string; href: string; icon: any }[] = [];

  // Dashboard for admin roles only
  if (user.role === 'super_admin' || user.role === 'admin') {
    navigation.push({ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard });
  }

  navigation.push({ name: 'Assessments', href: '/assessments', icon: ClipboardList });

  // Organizations management for super_admin only
  if (user.role === 'super_admin') {
    navigation.push({ name: 'Organizations', href: '/organizations', icon: Building2 });
  }

  // User Directory for super admin and admin
  if (user.role === 'super_admin' || user.role === 'admin') {
    navigation.push({ name: 'User Directory', href: '/users', icon: Users });
  }

  // Settings for all roles
  navigation.push({ name: 'Settings', href: '/settings', icon: Settings });

  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Home';
    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('  /  ');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-[var(--font-inter)] relative">
      <div className="flex flex-1">
        {/* --- Sidebar Desktop --- */}
        <aside
          className={`hidden md:flex flex-col shrink-0 bg-white border-r border-gray-200 transition-all duration-300 relative z-30 ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 bg-[#0072BC]/10 rounded-xl border border-[#0072BC]/20">
                <Shield className="h-5 w-5 text-[#0072BC]" />
              </div>
              {sidebarOpen && (
                <span className="font-extrabold text-sm tracking-tight text-[#003366] truncate">
                  CHP Maturity
                </span>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                      ? 'bg-[#0072BC]/10 border border-[#0072BC]/20 text-[#0072BC]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${
                      isActive ? 'text-[#0072BC]' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Details */}
          <div className="p-4 border-t border-gray-200">
            {sidebarOpen ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="h-9 w-9 rounded-full bg-[#0072BC]/10 flex items-center justify-center text-[#0072BC] font-bold border border-[#0072BC]/20">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-xs font-bold text-gray-900 truncate">{user.fullName}</span>
                    <span className="block text-[10px] text-gray-500 truncate">{user.organizationName || 'No Org'}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-200 hover:border-red-300 transition-all active:scale-[0.98]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          {originalUser && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 border-b border-amber-400 text-white text-xs font-bold py-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg z-30 relative animate-slide-down">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-200 animate-ping"></span>
                <span>Impersonation Active: Viewing platform as <strong className="underline">{user.fullName}</strong> ({getRoleLabel(user.role)})</span>
              </div>
              <button
                onClick={() => {
                  stopImpersonation();
                  router.push('/users');
                }}
                className="py-1 px-3 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white text-[10px] font-extrabold uppercase tracking-wide transition-all active:scale-[0.98]"
              >
                Return to Admin Account
              </button>
            </div>
          )}
          
          {/* --- Header --- */}
          <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 relative z-20">
            <div className="flex items-center gap-3">
              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 md:hidden transition-colors"
              >
                <Menu className="h-5.5 w-5.5" />
              </button>
              
              {/* Breadcrumb info */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{getBreadcrumb()}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Role Badge */}
              <div className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider ${getRoleBadgeStyles(user.role)}`}>
                {getRoleLabel(user.role)}
              </div>

              {/* User Profile dropdown desktop */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-xl bg-[#0072BC]/10 border border-[#0072BC]/20 flex items-center justify-center text-[#0072BC] font-bold text-sm">
                    {user.fullName.charAt(0)}
                  </div>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl p-4 shadow-lg border border-gray-200 z-40">
                      <div className="mb-3 pb-3 border-b border-gray-200">
                        <span className="block text-xs font-bold text-gray-900">{user.fullName}</span>
                        <span className="block text-[10px] text-gray-500 truncate mt-0.5">{user.email}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left py-2 px-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
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
      </div>

      {/* --- Footer --- */}
      <footer className="bg-[#003366] text-white py-4 px-6 text-center text-xs font-medium">
        <p>&copy; {new Date().getFullYear()} CHP Maturity Index Assessment Platform. All rights reserved.</p>
      </footer>

      {/* --- Mobile Sidebar Overlay --- */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col md:hidden shadow-xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-[#0072BC]" />
                <span className="font-extrabold text-sm tracking-tight text-[#003366]">
                  CHP Maturity
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
                        ? 'bg-[#0072BC]/10 border border-[#0072BC]/20 text-[#0072BC]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#0072BC]' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-200">
                <div className="h-8 w-8 rounded-full bg-[#0072BC]/10 flex items-center justify-center text-[#0072BC] font-bold border border-[#0072BC]/20">
                  {user.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <span className="block text-xs font-bold text-gray-900 truncate">{user.fullName}</span>
                  <span className="block text-[10px] text-gray-500 truncate">{user.organizationName || 'No Org'}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-200 transition-all"
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
