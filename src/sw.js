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

workbox.precaching.precacheAndRoute([]);
// How do we cache mp3 in a way that enables seeking within the track?
// https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av

// 1. Try adding the plugins to precaching...
workbox.precaching.addPlugins([
    new workbox.cacheableResponse.Plugin({statuses: [200]}),
    new workbox.rangeRequests.Plugin(),
]);
