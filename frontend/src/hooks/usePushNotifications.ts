import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api-client';

/**
 * Web Push subscription hook (workflows.md #25).
 *
 * Registers the service worker, requests notification permission, and subscribes
 * the browser to push notifications via the backend. Gracefully no-ops when the
 * browser lacks Push support or when the backend hasn't configured VAPID keys.
 */
export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setSupported(
      typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window,
    );
    if (typeof Notification !== 'undefined') setPermission(Notification.permission);
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported) return false;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const { data } = await api.get('/push/vapid-public-key');
      const publicKey = urlBase64ToUint8Array(data.public_key);

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey as BufferSource,
        });
      }

      const json = subscription.toJSON();
      await api.post('/push/subscribe', {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      });
      return true;
    } catch (err) {
      console.error('Push subscription failed', err);
      return false;
    }
  }, [supported]);

  return { supported, permission, subscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}
