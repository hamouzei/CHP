import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organizationId: string | null;
  organizationName: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'chpmi-auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : sessionStorage)),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
