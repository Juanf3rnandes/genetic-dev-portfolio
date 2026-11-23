/*
 * O arcade (que precisava deste service worker de isolamento cross-origin) foi
 * removido. Este arquivo continua existindo só para desregistrar o worker nos
 * navegadores que já o instalaram.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url))),
  );
});
