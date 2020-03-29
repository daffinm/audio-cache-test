// File generated initially by $ workbox wizard --injectManifest
// For args @see https://developers.google.com/web/tools/workbox/modules/workbox-cli

module.exports = {
  globDirectory: "www/",
  globPatterns: [
    "**/*",
  ],
  globIgnores: [
    "index.html",
    "manifest.json",
    "favicon.ico",
    "sw.js",
  ],
  swSrc: "www-deploy/sw.js",
  swDest: "www-deploy/sw.js",
  injectionPoint: 'self.__RUNTIME_MANIFEST',
  // Add this line to suppress precache warnings from injectManifest abput large file sizes.
  maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
};