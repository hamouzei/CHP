'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Only super_admin can access the dashboard
        if (user?.role === 'super_admin') {
          router.push('/dashboard');
        } else {
          router.push('/assessments');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="text-sm text-slate-400">Loading CHP Maturity Platform...</span>
      </div>
    </div>
  );
}
