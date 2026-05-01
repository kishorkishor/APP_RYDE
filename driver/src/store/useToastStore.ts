import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

type ToastState = {
  message: string | null;
  type: ToastType;
  visible: boolean;
};

type ToastActions = {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
};

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState & ToastActions>()((set) => ({
  message: null,
  type: 'info',
  visible: false,

  showToast: (message, type = 'error') => {
    if (dismissTimer) clearTimeout(dismissTimer);
    set({ message, type, visible: true });
    dismissTimer = setTimeout(() => {
      set({ visible: false });
      dismissTimer = null;
    }, 3500);
  },

  hideToast: () => {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    set({ visible: false });
  },
}));
