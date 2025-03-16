/**
 * 综合管理系统 - Service Worker
 * 用于支持PWA的离线访问功能
 */

// 缓存名称和版本
const CACHE_NAME = 'manger-system-cache-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/manifest.json',
  '/pwa-installer.js',
  '/volunteer-system/index.html',
  '/volunteer-system/css/styles.css',
  '/volunteer-system/js/app.js',
  '/chemical-system/index.html',
  '/chemical-system/css/styles.css',
  '/chemical-system/js/app.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js',
];

// 安装Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker 安装中...');

  // 等待直到所有资源被缓存
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('缓存静态资源中...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('静态资源缓存完成');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('缓存静态资源失败:', error);
      }),
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker 激活中...');

  // 清理旧缓存
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }),
        );
      })
      .then(() => {
        console.log('Service Worker 现在控制客户端');
        return self.clients.claim();
      }),
  );
});

// 拦截网络请求
self.addEventListener('fetch', event => {
  // 跳过不支持缓存的请求（如chrome-extension://等）
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // 尝试从缓存中查找匹配的资源
    caches.match(event.request).then(cachedResponse => {
      // 如果找到了缓存的响应，则返回它
      if (cachedResponse) {
        return cachedResponse;
      }

      // 否则，发送网络请求
      return fetch(event.request)
        .then(response => {
          // 检查是否收到有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 克隆响应，因为响应是一个流，只能使用一次
          const responseToCache = response.clone();

          // 将响应添加到缓存
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(error => {
          console.error('网络请求失败:', error);

          // 如果是HTML页面请求失败，返回离线页面
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }

          // 其他请求失败，尝试返回通用错误响应
          return new Response('网络连接失败，请检查您的网络连接', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
    }),
  );
});

// 接收消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 后台同步
self.addEventListener('sync', event => {
  console.log('后台同步事件:', event.tag);

  // 未来可以在这里处理离线提交的数据同步
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// 同步数据的函数（预留功能）
function syncData() {
  console.log('执行数据同步...');
  // 未来实现：将IndexedDB中的离线数据发送到服务器
  return Promise.resolve();
}
