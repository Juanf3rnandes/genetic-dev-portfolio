/*
 * Service worker de isolamento cross-origin.
 *
 * O core mGBA usa threads (SharedArrayBuffer), que só existem quando a página
 * é servida com COOP/COEP. GitHub Pages não deixa configurar headers, então
 * este worker os adiciona a cada resposta. Só é registrado quando alguém liga
 * o arcade (ver src/arcade/arcade.ts).
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.status === 0) return res; // resposta opaca: não dá para mexer
        const headers = new Headers(res.headers);
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
      })
      .catch(() => Response.error()),
  );
});
