'use client';

import React from 'react';
import { HelpCircle, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.03),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.02),transparent_50%)] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-slate-900/80 shadow-2xl relative z-10 text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <HelpCircle className="h-9 w-9" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-white">
            404
          </h1>
          <h2 className="text-xl font-bold bg-gradient-to-r from-violet-200 via-slate-100 to-cyan-200 bg-clip-text text-transparent">
            Page Not Found
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed pt-1">
            The resource scope or address you tried to reach does not exist or has been archived under an older framework version.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/assessments"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/15 transition-all active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            Back to Assessments
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
