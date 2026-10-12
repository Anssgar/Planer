// Zapamiętuje pliki aplikacji w telefonie. Dane (jsonbin, Worker) NIE są zapamiętywane — zawsze idą przez internet.
const CACHE = 'planer-v2';
const FILES = ['./index.html', './planer-obiadow.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // tylko własne pliki strony; wszystko inne (jsonbin, Worker, CDN) idzie normalnie
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // najpierw internet (żeby nowa wersja była od razu), a gdy go brak — kopia z telefonu
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
