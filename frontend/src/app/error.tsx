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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-[var(--font-inter)] p-6 relative overflow-hidden">
      <div className="w-full max-w-lg glass-card rounded-2xl p-8 shadow-lg relative z-10 text-center space-y-6">
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
          <ShieldAlert className="h-9 w-9" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Application Crash Detected
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
            An unexpected runtime exception interrupted the assessment flow. The error has been captured and queued for developer inspection.
          </p>
        </div>

        {/* Stack Trace / Summary Details */}
        <div className="p-4 rounded-xl bg-gray-100 border border-gray-200 text-left font-mono text-[11px] text-gray-600 overflow-y-auto max-h-36">
          <span className="block font-bold text-red-600 mb-1">Diagnostic Log:</span>
          <span className="block whitespace-pre-wrap">{error.message || 'Unknown application execution exception'}</span>
          {error.digest && <span className="block text-gray-400 mt-2">Digest ID: {error.digest}</span>}
        </div>

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md transition-all active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Partition
          </button>
          
          <Link
            href="/assessments"
            className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all active:scale-[0.98]"
          >
            <Home className="h-3.5 w-3.5" />
            Return to Safety
          </Link>
        </div>
      </div>
    </div>
  );
}
