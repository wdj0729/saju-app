/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() as { title?: string; body?: string } | undefined;
  event.waitUntil(
    sw.registration.showNotification(data?.title ?? '사주팔자', {
      body: data?.body ?? '오늘 운세를 확인해보세요 ✨',
      icon: '/icon-192.png',
    })
  );
});

sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    sw.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/fortune') && 'focus' in client) {
          return client.focus();
        }
      }
      return sw.clients.openWindow('/fortune');
    })
  );
});
