// Minimal push service worker (workflows.md #25 push channel).
// Receives push events from the backend (pywebpush) and displays a notification.
self.addEventListener("push", (event) => {
  let payload = { title: "Ummah Directory", body: "" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: payload.data || {},
      icon: "/vite.svg",
      badge: "/vite.svg",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(clients.openWindow(url));
});
