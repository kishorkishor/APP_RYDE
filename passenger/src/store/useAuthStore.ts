// ─── Auth Store ───────────────────────────────────────────────────────────────
import { create } from 'zustand';

type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  companyName?: string | null;
  projectLeader?: string | null;
  projectCode?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasLocationPermission: boolean;
};

type AuthActions = {
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: () => void;
  setLocationPermission: (granted: boolean) => void;
  logout: () => void;
};

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  hasLocationPermission: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

  setLocationPermission: (hasLocationPermission) =>
    set({ hasLocationPermission }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
