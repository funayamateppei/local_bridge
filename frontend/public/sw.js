/// <reference lib="webworker" />

// Service Worker のキャッシュ名
const CACHE_NAME = 'local-bridge-v1'
const RUNTIME_CACHE = 'runtime-cache-v1'

// キャッシュするリソース（静的アセット）
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json']

// インストール時: 静的リソースをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
  // 新しいService Workerを即座にアクティブ化
  self.skipWaiting()
})

// アクティベーション時: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  // すべてのクライアントを制御下に置く
  self.clients.claim()
})

// フェッチ時: Cache-First 戦略（オフライン優先）
self.addEventListener('fetch', (event) => {
  const { request } = event

  // API リクエストはネットワーク優先
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功した場合はランタイムキャッシュに保存
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュから返す（オフライン対応）
          return caches.match(request)
        })
    )
    return
  }

  // 静的リソースはキャッシュ優先
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      // キャッシュになければネットワークから取得
      return fetch(request).then((response) => {
        // 有効なレスポンスのみキャッシュ
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        const responseClone = response.clone()
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone)
        })

        return response
      })
    })
  )
})
