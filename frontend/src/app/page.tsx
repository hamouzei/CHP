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
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 text-[#0072BC] animate-spin" />
        <span className="text-sm text-gray-500">Loading CHP Maturity Platform...</span>
      </div>
    </div>
  );
}
