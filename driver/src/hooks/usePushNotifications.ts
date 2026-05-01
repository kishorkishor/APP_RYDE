import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { registerForPushNotificationsAsync } from '@/src/services/pushNotifications';
import { useDriverAuthStore } from '@/src/store/useDriverAuthStore';
import { savePushToken } from '@/src/services/driverRecords';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const router = useRouter();
  const profile = useDriverAuthStore((s) => s.profile);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        try {
          await savePushToken(profile.id, token);
        } catch {
          // best-effort
        }
      }
    })();

    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.rideId) {
          router.push('/(trip)/incoming-ride');
        }
      },
    );

    return () => {
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [profile?.id]);
}
