// Kill switch — uLearn no longer uses a service worker (it was causing
// duplicate React instances to mount on the same page). This file exists
// solely to replace any previously-installed service worker: the browser
// fetches this on its periodic update check, sees the bytes differ from
// whatever was cached before, installs it, and this immediately unregisters
// itself and clears every cache it can reach, then reloads open tabs once.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
