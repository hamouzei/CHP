'use client';

import React from 'react';
import { useAuthStore } from '../../../store/authStore';
import { Shield, ArrowRight, LayoutDashboard, Database, HelpCircle, FileCheck2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardShellPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl -z-10"></div>
        
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-300 mb-4">
            <Shield className="h-3.5 w-3.5" />
            CHPMI Platform Active
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Welcome, {user.fullName}
          </h1>
          <p className="mt-2.5 text-slate-400 leading-relaxed text-sm sm:text-base">
            This digital platform facilitates standardized maturity assessments of Community Health Programs (CHP). Collect criteria scores, justifications, evidence files, and generate official analytics.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/assessments"
              className="inline-flex items-center gap-2 py-3 px-5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 transition-all duration-300 active:scale-[0.98]"
            >
              Assessments Manager
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="h-10 w-10 bg-violet-600/10 rounded-2xl border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-105 transition-transform">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Active Organization</h3>
          <p className="mt-1 text-2xl font-extrabold text-white tracking-tight">{user.organizationName || 'No Organization'}</p>
          <span className="block mt-2.5 text-xs text-slate-400">Assigned organization context for scoring.</span>
        </div>

        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="h-10 w-10 bg-cyan-600/10 rounded-2xl border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Access Clearance</h3>
          <p className="mt-1 text-2xl font-extrabold text-white tracking-tight capitalize">{user.role.replace('_', ' ')}</p>
          <span className="block mt-2.5 text-xs text-slate-400">Role-based controls are active.</span>
        </div>

        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="h-10 w-10 bg-emerald-600/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Framework Content</h3>
          <p className="mt-1 text-2xl font-extrabold text-white tracking-tight">5 Domains / 30 Criteria</p>
          <span className="block mt-2.5 text-xs text-slate-400">CHP Maturity Index criteria levels seeded.</span>
        </div>
      </div>

      {/* Info notice about current status */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-900/60 bg-slate-900/10 text-slate-400 text-xs">
        <p className="leading-relaxed">
          <strong className="text-slate-300 font-bold">Phase 6 Complete:</strong> The core Next.js structural framework, styling theme, persistent state store, API service client, and authentication layers are now fully implemented and active. Full interactive widgets, Recharts layouts, CHPMI gauge gauges, and priority gap lists will be introduced and fully connected in <span className="text-violet-400 font-bold">Phase 8</span>.
        </p>
      </div>
    </div>
  );
}
