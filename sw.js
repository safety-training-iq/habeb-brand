/* حبيب براند — Service Worker (تثبيت التطبيق + العمل بدون نت + إشعارات OneSignal) */
try { importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js"); } catch (e) {}

const V = "hb-v2";
const CORE = ["./", "index.html", "manifest.webmanifest", "assets/logo-white.png", "assets/icon-192.png", "assets/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith("hb-") && k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;           // خطوط، خرائط، OneSignal… تروح للنت مباشرة
  if (u.pathname.endsWith("admin.html")) return;       // لوحة التحكم دائماً من النت

  // الصور والملفات الثابتة: من الذاكرة أولاً (أسرع)
  if (/\/(images|assets)\//.test(u.pathname)) {
    e.respondWith(
      caches.open(V).then(async (c) => {
        const hit = await c.match(r);
        if (hit) return hit;
        const res = await fetch(r);
        if (res.ok) c.put(r, res.clone());
        return res;
      })
    );
    return;
  }

  // الصفحة والبيانات: من النت أولاً (حتى تبين الأحذية الجديدة فوراً)، وإذا ماكو نت من الذاكرة
  const key = u.origin + u.pathname;
  e.respondWith(
    fetch(r)
      .then((res) => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(key, cp)); }
        return res;
      })
      .catch(() => caches.match(key).then((m) => m || caches.match("index.html")))
  );
});
