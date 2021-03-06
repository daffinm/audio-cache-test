importScripts('https://cdn.jsdelivr.net/gh/daffinm/pwa-utils@latest/js/assert.js');

function WorkboxCacheFileInfo(fileInfoArray) {
    function initFileInfoMap(fileInfoArray) {
        let map = {};
        for (let info of fileInfoArray) {
            assert.isDefined(info.url, `info.url`);
            assert.isDefined(info.revision, `info.revision`);
            map[info.url] = info.revision;
        }
        return map;
    }
    function getRelativeUrlFrom(url) {
        // Strip any parameters
        url = url.replace(/\?.*$/, '').trim();
        // Grab the relative URL
        let matches = url.match(/https?:\/\/[^/]*\/(.*)$/);
        assert.isDefined(matches, 'matches');
        return matches[1];
    }
    const FILE_INFO_MAP = initFileInfoMap(fileInfoArray);
    const WORKBOX_REVISION_PARAM = '__WB_REVISION__';
    this.getRevisionFor = function (url) {
        let key = getRelativeUrlFrom(url);
        let revision = FILE_INFO_MAP[key];
        return revision;
    };
    this.hasRevisionFor = function (url) {
        if (this.getRevisionFor(url)) {
            return true;
        }
        return false;
    };
    this.addRevisionParameterTo = function (url) {
        assert.isTrue(this.hasRevisionFor(url), `Bug: No revision found for ${url}`);
        let revision = this.getRevisionFor(url);
        return `${url}?${WORKBOX_REVISION_PARAM}=${revision}`;
    };
    this.getRevisionParameterFrom = function (url) {
        let regex = new RegExp(`https?:\/\/[^/]*\/(.*)\?${WORKBOX_REVISION_PARAM}=(.*$)`);
        let matches = url.match(regex);
        if (matches) {
            return matches[2];
        }
        return null;
    };
}

// Implements the workbox routing RouteHanderObject's handle method.
function WorkboxCacheBeforeCacheOnly(serviceWorkerExecutionContext, cacheName, cacheFileInfoArray) {

    const CACHE_MATCH_OPTIONS = Object.freeze({ignoreSearch: true, ignoreVary: true});
    const CACHE_NAME = cacheName;
    this.cacheName = CACHE_NAME; //for debugging.
    const CACHE_FILE_INFO = new WorkboxCacheFileInfo(cacheFileInfoArray);

    const myCacheOnlyRouteHandler = new workbox.strategies.CacheOnly({
        cacheName: CACHE_NAME,
        plugins: [
            new workbox.cacheableResponse.CacheableResponsePlugin({statuses: [200]}),
            new workbox.rangeRequests.RangeRequestsPlugin(),
        ],
        matchOptions: {
            // This is needed since cached resources have a ?_WB_REVISION=... URL param added to them.
            ignoreSearch: true,
            // Firebase vary header caused cache match to fail for mp3 until added this.
            ignoreVary: true,
        }
        // TODO add expiration plugin? https://developers.google.com/web/tools/workbox/modules/workbox-expiration
    });
    function deleteOrphansFromCache(activationEvent) {
        activationEvent.waitUntil(
            caches.open(CACHE_NAME).then(function(cache) {
                cache.keys().then(function(keys) {
                    for (let response of keys) {
                        let cachedUrl = response.url;
                        let isCachedFileOrphan = !CACHE_FILE_INFO.hasRevisionFor(cachedUrl);
                        if (isCachedFileOrphan) {
                            debug.log(`Deleting orphan response from [${CACHE_NAME}]:\n${cachedUrl}`);
                            cache.delete(cachedUrl, CACHE_MATCH_OPTIONS);
                        }
                    }
                });
            })
                .catch(function (error) {
                    debug.error(`Problem deleting orphan(s) from cache [${CACHE_NAME}']:\n${error}`);
                })
        );
    }
    // Tune in to the service worker lifecycle so we can manage our cache.
    serviceWorkerExecutionContext.addEventListener('activate', function(event) {
        deleteOrphansFromCache(event);
        // Why not delete old versions of stuff whilst you are at it? Because we need to be offline first, so
        // only look for updates at runtime. An old version is better than no version at at all.
    });

    function stripParametersFrom(url) {
        return url.replace(/\?.*$/, '').trim();
    }
    let myCache = null;
    // Add the file to the cache if it has not already been added, or update the cache if a newer file exists
    // in the file revision data provided - wbCacheFileInfo
    async function updateCacheAsNecessary(url) {
        function log(resultMessage) {
            let message = `updateCacheAsNecessary: ${CACHE_NAME}\n - Request: ${url}\n - Result: ${resultMessage}`;
            debug.log(message);
        }
        url = stripParametersFrom(url);
        if (myCache === null) {
            myCache = await caches.open(CACHE_NAME);
            assert.isTrue(myCache, `Cannot open cache ${CACHE_NAME}`);
        }
        let alreadyCached = (await myCache.match(url, CACHE_MATCH_OPTIONS));
        if (alreadyCached) {
            log(`Response is already cached!`);
            let cachedRevision = CACHE_FILE_INFO.getRevisionParameterFrom(alreadyCached.url);
            // Handle case where previously cached resource did not use revision param.
            if (!cachedRevision) {
                log(`NO VERSION INFO! Re-caching response...`);
                await myCache.delete(url, CACHE_MATCH_OPTIONS);
                let urlToCache = CACHE_FILE_INFO.addRevisionParameterTo(url);
                await myCache.add(urlToCache);
            } else {
                let latestRevision = CACHE_FILE_INFO.getRevisionFor(url);
                assert.isDefined(latestRevision, 'latestRevision', `Bug: Cannot find latest revision info for file: ${url}`);
                if (cachedRevision !== latestRevision) {
                    log(`NEW VERSION DETECTED!\n -- Cached revision: ${cachedRevision}\n -- Latest revision: ${latestRevision}\n -- Re-caching response...`);
                    await myCache.delete(url, CACHE_MATCH_OPTIONS);
                    let urlToCache = CACHE_FILE_INFO.addRevisionParameterTo(url);
                    await myCache.add(urlToCache);
                }
            }

        } else {
            log(`NOT CACHED! Caching response...`);
            let urlToCache = CACHE_FILE_INFO.addRevisionParameterTo(url);
            await myCache.add(urlToCache);
        }
    }
    // =================================================================================================================
    // The public interface: matching and handling.
    // See https://developers.google.com/web/tools/workbox/modules/workbox-routing#matching_and_handling_in_routes
    // =================================================================================================================
    this.match = function ({url, event}) {
        assert.isTrue(url instanceof URL, 'url is not a URL', url);
        let matches = CACHE_FILE_INFO.hasRevisionFor(url.href);
        return matches;
    };
    this.handle = async function ({event, request}) {
        // debugger;
        await updateCacheAsNecessary(request.url);
        return myCacheOnlyRouteHandler.handle({event, request});
    };
}