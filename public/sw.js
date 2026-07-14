// Service worker Portal Toko Marmo: menerima push notification
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { isi: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.judul || "Portal Toko Marmo", {
      body: data.isi || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((daftar) => {
        for (const klien of daftar) {
          if ("focus" in klien) {
            klien.navigate(url);
            return klien.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
