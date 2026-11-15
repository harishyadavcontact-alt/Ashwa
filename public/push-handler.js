// Added to the generated service worker (see vite.config.ts, workbox.importScripts).
// Shows a trip update when the server sends a web push, and opens the app when tapped.

self.addEventListener('push', (event) => {
  let data = { title: 'Ashwa', body: 'Update from the van', url: '/parent' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Not JSON: keep the defaults.
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: data.tag || 'ashwa-trip',
      data: { url: data.url || '/parent' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/parent';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
