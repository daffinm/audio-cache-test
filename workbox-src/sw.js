// =====================================================================================================================
// WARNING: this file was generated. Edit ./workbox-src/sw.js and then run ./build to regenerate.
// =====================================================================================================================

function swlog(message, object) {
    console.log(`[Service Worker] ${message}`, object ? object : null);
}
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');
if (workbox) {
    swlog(`Yay! Workbox is loaded 😁`);
} else {
    swlog(`Boo! Workbox didn't load 😬`);
}
workbox.setConfig({debug: true});

workbox.core.setCacheNameDetails({
    prefix: 'act',
    suffix: 'v1',
    precache: 'install-time',
    runtime: 'run-time',
});

// =====================================================================================================================
// 1. Precached Audio File
// =====================================================================================================================
// "If you plan on precaching the media files, then you need to take an extra step to explicitly route things so that
// they're read from the precache, since the standard precache response handler won't use the range request plugins"
workbox.routing.registerRoute(
    /.*pre-cached\.(m4a|mp3)/,
    new workbox.strategies.CacheOnly({
        cacheName: workbox.core.cacheNames.precache,
        plugins: [
            new workbox.rangeRequests.Plugin(),
        ],
        // This is needed since precached resources may
        // have a ?_WB_REVISION=... URL param.
        matchOptions: {
            ignoreSearch: true,
        }
    }),
);
// Precache...
workbox.precaching.precacheAndRoute([]);

// ====================================================================================================================
// 2. Manually Cached Audio File
// =====================================================================================================================
const audioCacheName = workbox.core.cacheNames.prefix + '-audio-' +workbox.core.cacheNames.suffix;
// This route will go against the network if there isn't a cache match,
// but it won't populate the cache at runtime.
// If there is a cache match, then it will properly serve partial responses.
workbox.routing.registerRoute(
    /.*manually-cached\.(m4a|mp3)/,
    // new workbox.strategies.CacheFirst({
    new workbox.strategies.CacheOnly({
        cacheName: audioCacheName,
        plugins: [
            new workbox.cacheableResponse.Plugin({statuses: [200]}),
            new workbox.rangeRequests.Plugin(),
        ],
    }),
);
// It's up to you to either precache or explicitly call cache.add('movie.mp4')
// to populate the cache.
caches.open(audioCacheName)
    .then(function(cache) {
        cache.add('/audio/m4a/manually-cached.m4a');
        cache.add('/audio/mp3/manually-cached.mp3');
    })
    .catch(function (error) {
        swlog('Error populating audio cache manually:', error);
    });
