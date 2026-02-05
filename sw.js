const CACHE_NAME = "meqr-pwa-v5";

const ASSETS = [
  "./",
  "./manifest.json"
  // 注意: index.html は network-first で常に更新を優先する
  // アイコン画像や追加アセットがあればここに追記する（例: "./icons/icon-192.svg"）
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // ページ遷移（HTML）は常に network-first。
  // これで index.html の更新が SW キャッシュで止まる問題を回避する。
  const isNavigate = request.mode === "navigate" || request.destination === "document";

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const url = new URL(request.url);
      const sameOrigin = url.origin === self.location.origin;

      if (isNavigate) {
        try {
          const fresh = await fetch(new Request(request, { cache: "no-store" }));
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch (_) {
          const cached = await caches.match("./index.html");
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      }

      // CDN等の cross-origin もキャッシュして、2回目以降のオフライン起動を成立させる。
      if (!sameOrigin) {
        const cached = await caches.match(request);
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (_) {
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      }

      // 同一オリジンの静的アセットは stale-while-revalidate。
      const cached = await caches.match(request);
      const fetchAndUpdate = fetch(request)
        .then(async response => {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(fetchAndUpdate);
        return cached;
      }

      const response = await fetchAndUpdate;
      if (response) return response;
      return new Response("Offline", { status: 503, statusText: "Offline" });
    })()
  );
});

