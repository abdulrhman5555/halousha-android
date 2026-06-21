/* ============================================
   Service Worker — التشغيل الأوفلاين + التحديث التلقائي
   ============================================
   كل مرة تنزل تحديث فعلي على الملفات (مو بيانات Firebase، بل كود/تصميم):
   غيّر رقم CACHE_VERSION بالأسفل ← هذا يجبر التطبيق يحذف النسخة القديمة
   ويحمّل كل شي من جديد تلقائياً بدون ما يحتاج المستخدم يسوي شي.
*/

const CACHE_VERSION = 'v1';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

// الملفات الأساسية التي يجب أن تكون متوفرة دائماً حتى أول فتحة بدون إنترنت
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/shell.css',
  './assets/js/shell.js',
  './assets/js/update-checker.js',
  './sections/music/index.html',
  './sections/drawing/index.html',
  './sections/ai/index.html',
  './sections/stories/index.html',
  './sections/cooking/index.html',
  './sections/photos/index.html',
  './sections/games/index.html',
  './sections/admin/index.html',
];

// ---------- التثبيت: تنزيل الملفات الأساسية ----------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(CORE_ASSETS).catch((err) => {
        // لو ملف ناقص ما يوقف كل التنصيب
        console.warn('[SW] بعض الملفات الأساسية لم تُحفظ:', err);
      })
    )
  );
  self.skipWaiting(); // تفعيل النسخة الجديدة فوراً بدون انتظار إغلاق كل التبويبات
});

// ---------- التفعيل: حذف أي نسخة كاش قديمة ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('app-cache-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ---------- استراتيجية الجلب ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // صفحات HTML (بما فيها الأقسام داخل الـ iframe): الشبكة أولاً، وإلا الكاش
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // باقي الملفات (CSS/JS/صور/صوت): كاش فوري + تحديث بالخلفية
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await caches.match(req);
    return cached || caches.match('./index.html');
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  const networkFetch = fetch(req)
    .then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || (await networkFetch) || Response.error();
}

// ---------- استقبال أوامر يدوية من الصفحة (مثلاً تفريغ الكاش) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
