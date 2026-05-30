'use client';

import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Crash:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-6 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.03),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.02),transparent_50%)] pointer-events-none"></div>

      <div className="w-full max-w-lg glass-card rounded-3xl p-8 border border-slate-900/80 shadow-2xl relative z-10 text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-650/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <ShieldAlert className="h-9 w-9" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-red-200 via-slate-100 to-indigo-200 bg-clip-text text-transparent">
            Application Crash Detected
          </h1>
          <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            An unexpected runtime exception interrupted the assessment flow. The error has been captured and queued for developer inspection.
          </p>
        </div>

        {/* Stack Trace / Summary Details */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-900 text-left font-mono text-[10px] text-slate-400 overflow-y-auto max-h-36">
          <span className="block font-bold text-red-400 mb-1">Diagnostic Log:</span>
          <span className="block whitespace-pre-wrap">{error.message || 'Unknown application execution exception'}</span>
          {error.digest && <span className="block text-slate-500 mt-2">Digest ID: {error.digest}</span>}
        </div>

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-md shadow-red-500/10 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Partition
          </button>
          
          <Link
            href="/assessments"
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-xs font-bold text-slate-300 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-all active:scale-[0.98]"
          >
            <Home className="h-3.5 w-3.5" />
            Return to Safety
          </Link>
        </div>
      </div>
    </div>
  );
}
