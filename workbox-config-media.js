// This is used to injectManifest for audio files only. This information is then used to
// keep the runtime audio cache up to date, including deletion of orphan audio files.
module.exports = {
    globDirectory: 'www/',
    globPatterns: [
        '**/media/*',
    ],
    // Don't injectManifest into source files. Use files copied to the dist directory.
    swSrc: 'www-deploy/sw.js',
    swDest: 'www-deploy/sw.js',
    injectionPoint: 'self._MEDIA_FILES',
    // Add this line to suppress precache warnings from injectManifest abput large file sizes.
    maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
};