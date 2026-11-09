/* 근력노트 서비스 워커: 앱 파일을 저장해 두고 오프라인에서도 열리게 함 */
var CACHE = 'geunryeok-note-v26';
var FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  var url = new URL(req.url);
  // 같은 주소의 GET 요청만 처리 (구글 시트 전송 등 외부 요청은 건드리지 않음)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      // 저장본이 있으면 먼저 보여주고, 뒤에서 최신본으로 갱신 (다음 실행 때 반영)
      return cached || network;
    })
  );
});
