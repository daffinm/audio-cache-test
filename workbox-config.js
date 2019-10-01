// File generated initially by $ workbox wizard --injectManifest
// Added maximumFileSizeToCacheInBytes manually.
// For args @see https://developers.google.com/web/tools/workbox/modules/workbox-cli

module.exports = {
  "globDirectory": "www/",
  "globPatterns": [
    "{index.html,audio/pre-cached.m4a,audio/pre-cached.mp3,audio/pre-cached-no-router.mp3,**/*.js}"
  ],
  "swSrc" : "www/sw.js",
  "swDest": "www-deploy/sw.js",
  "maximumFileSizeToCacheInBytes": 4 * 1024 * 1024
};