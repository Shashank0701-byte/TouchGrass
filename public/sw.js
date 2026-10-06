/* Keep this shell worker small. Quest data belongs in IndexedDB, never Cache Storage. */
const SHELL_CACHE = "touchgrass-shell-v1";
const ASSET_CACHE = "touchgrass-assets-v1";
const NEXT_STATIC = "/_next/static/";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await Promise.allSettled([
      "/offline.html",
      "/icon.svg",
      "/manifest.webmanifest",
    ].map(async (path) => {
      const response = await fetch(path, { cache: "reload" });
      if (response.ok) await shell.put(path, response);
    }));

    try {
      const response = await fetch("/", { cache: "reload" });
      if (response.ok) {
        await shell.put("/", response.clone());
        const html = await response.text();
        const urls = new Set();
        for (const match of html.matchAll(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/g)) {
          urls.add(new URL(match[1].replaceAll("&amp;", "&"), self.location.origin).href);
        }
        const assets = await caches.open(ASSET_CACHE);
        await Promise.allSettled([...urls].map(async (url) => {
          const asset = await fetch(url, { cache: "reload" });
          if (asset.ok) await assets.put(url, asset);
        }));
      }
    } catch {
      // A failed pre-cache leaves the standalone offline page available.
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith("touchgrass-") && !keep.has(name))
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const shell = await caches.open(SHELL_CACHE);
          await shell.put(url.pathname === "/" ? "/" : request, response.clone());
        }
        return response;
      } catch {
        const shell = await caches.open(SHELL_CACHE);
        return (await shell.match(request))
          || (await shell.match(url.pathname))
          || (await shell.match("/"))
          || (await shell.match("/offline.html"));
      }
    })());
    return;
  }

  if (url.pathname.startsWith(NEXT_STATIC)) {
    event.respondWith((async () => {
      const assets = await caches.open(ASSET_CACHE);
      const cached = await assets.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await assets.put(request, response.clone());
        return response;
      } catch {
        return new Response("", { status: 503, statusText: "Offline" });
      }
    })());
  }
});
