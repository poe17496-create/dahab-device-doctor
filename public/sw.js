// Dahab Device Doctor - Service Worker v5 (Chunk-Safe)
// تاريخ التحديث: 2026-09-29 - حل مشكلة ChunkLoadError بعد كل نشر
const CACHE_VERSION = 'dahab-v5';
const CACHE_NAME = CACHE_VERSION + '-' + self.location.hostname;

// الأصول الثابتة التي يمكن تخزينها بأمان (لا تتغير بتغيير الكود)
const CACHEABLE_ASSETS = [
  '/manifest.json',
  '/logo.jpg',
  '/favicon.ico',
];

// 1. التثبيت: تخطي الانتظار فوراً
self.addEventListener('install', (event) => {
  console.log('[SW v5] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        CACHEABLE_ASSETS.map(url => cache.add(url).catch(e => console.warn('[SW] Could not cache:', url, e)))
      );
    })
  );
});

// 2. التفعيل: حذف كل الكاشات القديمة فوراً
self.addEventListener('activate', (event) => {
  console.log('[SW v5] Activating, clearing old caches...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map((key) => {
          console.log('[SW v5] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('[SW v5] Activated and controlling all clients');
      return self.clients.claim();
    })
  );
});

// 3. معالجة الطلبات
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isLocalRequest = url.origin === self.location.origin;

  // --- استثناءات دائمة: طلبات الشبكة فقط (لا كاش أبداً) ---

  // كل الـ APIs والأدمن
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) {
    return; // تجاهل تماماً = المتصفح يتولى بدون SW
  }

  // طلبات غير GET
  if (event.request.method !== 'GET') {
    return;
  }

  // ملفات Next.js الثابتة (_next/static) - يجب دائماً من الشبكة لتجنب ChunkLoadError
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // إذا فشلت الشبكة تماماً، أعد خطأ صريح (لا تعطِ نسخة قديمة)
        return new Response('Network error: could not load JS chunk', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
    return;
  }

  // طلبات التنقل (صفحات HTML): Network-First دائماً
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => cached || caches.match('/'))
            .then(cached => cached || new Response('<h1>أنت غير متصل بالإنترنت</h1>', {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }));
        })
    );
    return;
  }

  // الأصول الثابتة (صور، أيقونات): Cache-First مع تحديث في الخلفية
  if (isLocalRequest && CACHEABLE_ASSETS.some(a => url.pathname === a || url.pathname.startsWith('/icons/'))) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // كل الطلبات الأخرى: Network-First
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// 4. استقبال رسائل إدارية
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // طلب مسح الكاش يدوياً من التطبيق
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
