const CACHE_NAME = 'FieldPins-cache-v2';
const OFFLINE_URLS = ['/', '/projects'];

const RSC_ACCEPT_HEADER = 'text/x-component';

const cachePath = (input) => {
  const url = new URL(typeof input === 'string' ? input : input.url, self.location.origin);
  return url.pathname;
};

const SAME_ORIGIN = self.location.origin;

const SRC_HREF_REGEX = /<(script|link)[^>]+?(?:src|href)="([^"]+)"/gi;

async function storeResponse(cache, request, response) {
  const cloneForExact = response.clone();
  await cache.put(request, cloneForExact);
  const pathKey = cachePath(request);
  await cache.put(pathKey, response.clone());
}

async function matchResponse(cache, request) {
  const exact = await cache.match(request);
  if (exact) return exact;
  return cache.match(cachePath(request));
}

function extractAssetUrls(html) {
  const assets = new Set();
  let match;
  while ((match = SRC_HREF_REGEX.exec(html)) !== null) {
    const candidate = match[2];
    if (!candidate) continue;
    if (candidate.startsWith('data:') || candidate.startsWith('http://') || candidate.startsWith('https://')) {
      try {
        const url = new URL(candidate, SAME_ORIGIN);
        if (url.origin !== SAME_ORIGIN) continue;
        assets.add(url.pathname + (url.search || ''));
      } catch {
        continue;
      }
    } else {
      try {
        const url = new URL(candidate, SAME_ORIGIN);
        assets.add(url.pathname + (url.search || ''));
      } catch {
        continue;
      }
    }
  }
  return Array.from(assets);
}

async function cacheRequestWithDeps(cache, request) {
  try {
    const res = await fetch(request);
    if (!res.ok) return;
    await storeResponse(cache, request, res.clone());

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      try {
        const html = await res.clone().text();
        const assetUrls = extractAssetUrls(html).filter((asset) => asset.startsWith('/_next'));
        await Promise.all(
          assetUrls.map(async (assetPath) => {
            try {
              const assetRequest = new Request(assetPath, { credentials: 'include' });
              const assetRes = await fetch(assetRequest);
              if (assetRes.ok) {
                await storeResponse(cache, assetRequest, assetRes.clone());
              }
            } catch {
              // Ignore asset fetch failures during warmup
            }
          })
        );
      } catch {
        // Ignore HTML parsing issues
      }
    }
  } catch {
    // Ignore warm cache failures (likely offline)
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (name === CACHE_NAME) return Promise.resolve(false);
          return caches.delete(name);
        })
      );
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(OFFLINE_URLS);
      } catch {
        // Ignore re-prime failures during activate (likely offline)
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  const acceptHeader = req.headers.get('accept') || '';

  // Handle Next.js Flight/RSC data requests
  if (acceptHeader.includes(RSC_ACCEPT_HEADER)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const res = await fetch(req);
          await storeResponse(cache, req, res);
          return res;
        } catch {
          const cached = await matchResponse(cache, req);
          return (
            cached ||
            new Response('', { status: 504, statusText: 'Offline' })
          );
        }
      })()
    );
    return;
  }

  // For navigation requests, try network first, then fall back to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          await storeResponse(cache, req, res);
          return res;
        } catch {
          return (
            (await caches.match(req)) ||
            (await caches.match('/projects')) ||
            (await caches.match('/')) ||
            new Response('Offline', { status: 503, statusText: 'Offline' })
          );
        }
      })()
    );
    return;
  }

  // For static assets and JS chunks, use cache-first with network fallback
  if (
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.destination === 'font'
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const res = await fetch(req);
          cache.put(req, res.clone());
          return res;
        } catch {
          // As a last resort, return a minimal offline response to avoid undefined
          return new Response('', { status: 504, statusText: 'Offline' });
        }
      })()
    );
  }
});

self.addEventListener('message', (event) => {
  const { type, urls } = event.data || {};
  if (type === 'CACHE_URLS' && Array.isArray(urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(
          urls.map(async (u) => {
            const request = new Request(u, { credentials: 'include' });
            await cacheRequestWithDeps(cache, request);
          })
        );
      })()
    );
  }
});

if (typeof self !== 'undefined' && self.__FieldPins_SW_TEST__) {
  Object.assign(self.__FieldPins_SW_TEST__, {
    cacheRequestWithDeps,
    extractAssetUrls,
    matchResponse,
    storeResponse,
  });
}
