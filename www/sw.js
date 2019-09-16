function swlog(message, object) {
    console.log(`[Service Worker] ${message}`, object ? object : null);
}
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');
if (workbox) {
    swlog(`Yay! Workbox is loaded 😁`);
} else {
    swlog(`Boo! Workbox didn't load 😬`);
}
workbox.core.setCacheNameDetails({
    prefix: 'audio-cache-test',
});

workbox.precaching.precacheAndRoute([
  {
    "url": "index.html",
    "revision": "b86eec878b4e3d0e6eae7a70a627bf41"
  },
  {
    "url": "Miaow-07-Bubble.m4a",
    "revision": "05abbdc4702604c0a697498a8d3e1142"
  }
]);
// How do we cache mp3 in a way that enables seeking within the track?
// https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av

// 1. Try adding the plugins to precaching...
workbox.precaching.addPlugins([
    new workbox.cacheableResponse.Plugin({statuses: [200]}),
    new workbox.rangeRequests.Plugin(),
]);
