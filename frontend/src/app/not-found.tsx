'use client';

import React from 'react';
import { HelpCircle, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-[var(--font-inter)] p-6 relative overflow-hidden">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-lg relative z-10 text-center space-y-6">
        {/* Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0072BC]/10 border border-[#0072BC]/20 flex items-center justify-center text-[#0072BC]">
          <HelpCircle className="h-9 w-9" />
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-gray-900">
            404
          </h1>
          <h2 className="text-xl font-bold text-[#0072BC]">
            Page Not Found
          </h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed pt-1">
            The resource scope or address you tried to reach does not exist or has been archived under an older framework version.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/assessments"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-white bg-[#0072BC] hover:bg-[#005a94] shadow-md transition-all active:scale-[0.98]"
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
