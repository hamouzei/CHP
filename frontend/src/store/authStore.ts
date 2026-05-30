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
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  originalUser: User | null;
  originalAccessToken: string | null;
  originalRefreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setAccessToken: (accessToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  startImpersonation: (targetUser: User, targetAccessToken: string) => void;
  stopImpersonation: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      originalUser: null,
      originalAccessToken: null,
      originalRefreshToken: null,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          originalUser: null,
          originalAccessToken: null,
          originalRefreshToken: null,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          originalUser: null,
          originalAccessToken: null,
          originalRefreshToken: null,
        }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      startImpersonation: (targetUser, targetAccessToken) =>
        set((state) => ({
          originalUser: state.originalUser || state.user,
          originalAccessToken: state.originalAccessToken || state.accessToken,
          originalRefreshToken: state.originalRefreshToken || state.refreshToken,
          user: targetUser,
          accessToken: targetAccessToken,
          refreshToken: null, // do not use original admin refresh token for user session
          isAuthenticated: true,
        })),
      stopImpersonation: () =>
        set((state) => ({
          user: state.originalUser,
          accessToken: state.originalAccessToken,
          refreshToken: state.originalRefreshToken,
          originalUser: null,
          originalAccessToken: null,
          originalRefreshToken: null,
          isAuthenticated: !!state.originalUser,
        })),
    }),
    {
      name: 'chpmi-auth-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : sessionStorage)),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        originalUser: state.originalUser,
        originalAccessToken: state.originalAccessToken,
        originalRefreshToken: state.originalRefreshToken,
      }),
    }
  )
);
