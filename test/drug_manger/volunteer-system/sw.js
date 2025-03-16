// 缓存名称和版本
const CACHE_NAME = 'volunteer-scheduler-cache-v1.1';

// 需要缓存的核心资源列表
const CORE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',
  './pwa-installer.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js',
];

// 图标资源
const ICON_ASSETS = [
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
];

// 合并所有需要缓存的资源
const CACHE_URLS = [...CORE_ASSETS, ...ICON_ASSETS];

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中');

  // 强制立即激活，跳过等待
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] 缓存核心资源');
      // 缓存核心资源，但不会因为图标缺失而失败
      return cache.addAll(CORE_ASSETS).then(() => {
        // 尝试缓存图标，但忽略失败
        return Promise.allSettled(
          ICON_ASSETS.map(icon =>
            cache.add(icon).catch(err => console.log(`[Service Worker] 图标缓存失败: ${icon}`, err)),
          ),
        );
      });
    }),
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中');

  // 清理旧缓存
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log('[Service Worker] 现在控制所有客户端');
        return self.clients.claim();
      }),
  );
});

// 处理资源请求
self.addEventListener('fetch', event => {
  // 记录请求URL，方便调试
  console.log('[Service Worker] 拦截请求:', event.request.url);

  // 网络优先策略，适用于经常更新的应用
  if (
    event.request.mode === 'navigate' ||
    (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./index.html');
      }),
    );
    return;
  }

  // 对于其他资源，使用缓存优先策略
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 如果找到缓存，返回缓存的资源
      if (cachedResponse) {
        return cachedResponse;
      }

      // 否则尝试从网络获取
      return fetch(event.request)
        .then(response => {
          // 检查响应是否有效
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应，因为响应流只能使用一次
          const responseToCache = response.clone();

          // 缓存新获取的资源
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
            console.log('[Service Worker] 缓存新资源:', event.request.url);
          });

          return response;
        })
        .catch(error => {
          console.log('[Service Worker] 获取资源失败:', error);

          // 对于HTML请求，返回离线页面
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }

          // 对于其他请求，返回错误
          throw error;
        });
    }),
  );
});

// 添加后台同步功能支持
self.addEventListener('sync', event => {
  console.log('[Service Worker] 后台同步事件:', event.tag);

  if (event.tag === 'sync-data') {
    // 这里可以实现数据同步逻辑
    console.log('[Service Worker] 执行数据同步');
  }
});

// 添加推送通知支持
self.addEventListener('push', event => {
  console.log('[Service Worker] 收到推送消息:', event.data.text());

  const data = event.data.json();

  const options = {
    body: data.body || '有新的排班通知',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
  };

  event.waitUntil(self.registration.showNotification('志愿者排班系统', options));
});

// 通知点击事件
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知被点击');

  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // 如果已有窗口打开，切换到该窗口
      for (let client of windowClients) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新窗口
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    }),
  );
});
