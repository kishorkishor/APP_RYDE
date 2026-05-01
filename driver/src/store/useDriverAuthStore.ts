// ─── Zustand: Driver Auth Store ───────────────────────────────────────────────
import { create } from 'zustand';
import type { DriverProfile } from '@/src/types';

type AuthState = {
  profile: DriverProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  hasLocationPermission: boolean;
  otpUserId: string | null;
  otpPhrase: string | null;
};

type AuthActions = {
  setProfile: (profile: DriverProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingComplete: () => void;
  setLocationPermission: (granted: boolean) => void;
  setOtpPending: (userId: string, phrase: string) => void;
  clearOtp: () => void;
  logout: () => void;
};

export type DriverAuthStore = AuthState & AuthActions;

export const useDriverAuthStore = create<DriverAuthStore>()((set) => ({
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,
  hasLocationPermission: false,
  otpUserId: null,
  otpPhrase: null,

  setProfile: (profile) =>
    set({ profile, isAuthenticated: !!profile, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

  setLocationPermission: (hasLocationPermission) =>
    set({ hasLocationPermission }),

  setOtpPending: (otpUserId, otpPhrase) =>
    set({ otpUserId, otpPhrase: otpPhrase }),

  clearOtp: () => set({ otpUserId: null, otpPhrase: null }),

  logout: () =>
    set({
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      otpUserId: null,
      otpPhrase: null,
    }),
}));
