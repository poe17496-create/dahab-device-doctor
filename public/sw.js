// Dahab Device Doctor - Service Worker v3 (Network-First with Auto-Update)
const CACHE_NAME = 'dahab-doctor-v3-' + Date.now();

const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.jpg',
  '/favicon.ico',
];

// 1. التثبيت والتخطي الفوري للانتظار
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => console.warn('Cache addAll note:', err));
    })
  );
});

// 2. التفعيل وحذف كافة الكاشات القديمة فوراً والتحكم بالعملاء
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Cleaning old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. استراتيجية Network-First لمنع تجميد الموبايل على النسخ القديمة
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // استثناء كافة طلبات الـ API والـ Admin وقواعد البيانات من الكاش تماماً
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    event.request.method !== 'GET'
  ) {
    return event.respondWith(fetch(event.request));
  }

  // لصفحات التنقل HTML: Network-First دائماً لضمان وصول أحدث كود منشور
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // إذا انقطع الإنترنت في الورشة، استرجع آخر نسخة مخزنة
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // للملفات الثابتة (صور، أيقونات): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// استقبال رسائل التحديث الإجباري
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
