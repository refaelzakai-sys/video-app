self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // נדרש כדי שהדפדפן יזהה את האתר כ-PWA
});

