'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const STORAGE_KEY = 'push-subscribed';

export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) return;
    setSupported(true);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        const isSubscribed = !!sub;
        setSubscribed(isSubscribed);
        if (isSubscribed) {
          localStorage.setItem(STORAGE_KEY, 'true');
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {
        setSubscribed(localStorage.getItem(STORAGE_KEY) === 'true');
      });
  }, []);

  if (!supported) return null;

  async function handleToggle() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch('/api/push/unsubscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        localStorage.removeItem(STORAGE_KEY);
        setSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('알림을 받으려면 브라우저에서 알림 권한을 허용해주세요.');
          return;
        }
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });
        localStorage.setItem(STORAGE_KEY, 'true');
        setSubscribed(true);
      }
    } catch (err) {
      console.error('[push] toggle failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="w-full bg-card-hover rounded-2xl px-3 py-2 text-xs text-left flex items-center justify-between"
    >
      <span className="text-primary">🔔 매일 운세 알림 받기</span>
      <span className={`text-xs ${subscribed ? 'text-hwa' : 'text-muted'}`}>
        {loading ? '...' : subscribed ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
