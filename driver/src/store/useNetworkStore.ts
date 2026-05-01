import { create } from 'zustand';

type NetworkState = {
  isConnected: boolean;
  isInternetReachable: boolean;
};

type NetworkActions = {
  setConnected: (connected: boolean) => void;
  setInternetReachable: (reachable: boolean) => void;
};

export const useNetworkStore = create<NetworkState & NetworkActions>()((set) => ({
  isConnected: true,
  isInternetReachable: true,
  setConnected: (isConnected) => set({ isConnected }),
  setInternetReachable: (isInternetReachable) => set({ isInternetReachable }),
}));
