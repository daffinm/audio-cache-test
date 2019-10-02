// File generated initially by $ workbox wizard --injectManifest
// Added maximumFileSizeToCacheInBytes manually.
// For args @see https://developers.google.com/web/tools/workbox/modules/workbox-cli

module.exports = {
  "globDirectory": "www/",
  "globPatterns": [
    "{index.html,media/*/auto-pre-cached*,**/*.js}"
  ],
  "swSrc" : "www/sw.js",
  "swDest": "www-deploy/sw.js",
  "maximumFileSizeToCacheInBytes": 4 * 1024 * 1024
};