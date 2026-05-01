import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '@/src/store/useNetworkStore';
import { useToastStore } from '@/src/store/useToastStore';

export function useNetworkListener() {
  const { setConnected, setInternetReachable } = useNetworkStore();
  const wasConnected = useRef(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      const reachable = state.isInternetReachable ?? true;

      setConnected(connected);
      setInternetReachable(reachable);

      if (!connected && wasConnected.current) {
        useToastStore.getState().showToast('No internet connection', 'warning');
      } else if (connected && !wasConnected.current) {
        useToastStore.getState().showToast('Back online', 'success');
      }

      wasConnected.current = connected;
    });

    return () => unsubscribe();
  }, []);
}
