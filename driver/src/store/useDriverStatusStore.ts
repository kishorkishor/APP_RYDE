// ─── Zustand: Driver Status Store ────────────────────────────────────────────
import { create } from 'zustand';
import type { DriverStatus } from '@/src/types';

type StatusState = {
  status: DriverStatus;
  isOnline: boolean;
};

type StatusActions = {
  setStatus: (status: DriverStatus) => void;
  setOnline: () => void;
  setOffline: () => void;
};

export type DriverStatusStore = StatusState & StatusActions;

export const useDriverStatusStore = create<DriverStatusStore>()((set) => ({
  status: 'online',
  isOnline: true,

  setStatus: (status) =>
    set({
      status,
      isOnline: status !== 'offline',
    }),

  setOnline: () => set({ status: 'online', isOnline: true }),

  setOffline: () => set({ status: 'offline', isOnline: false }),
}));
