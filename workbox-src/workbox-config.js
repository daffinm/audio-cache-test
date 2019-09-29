// File generated initially by $ workbox wizard --injectManifest
// Added maximumFileSizeToCacheInBytes manually.
// For args @see https://developers.google.com/web/tools/workbox/modules/workbox-cli

module.exports = {
  "globDirectory": "www/",
  "globPatterns": [
    "{index.html,audio/m4a/pre-cached.m4a,audio/mp3/pre-cached.mp3}"
  ],
  "swSrc" : "workbox-src/sw.js",
  "swDest": "www/sw.js",
  "maximumFileSizeToCacheInBytes": 4 * 1024 * 1024
};