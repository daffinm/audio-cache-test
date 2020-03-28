// Has a dependency on assert object defined in common.js.
function WorkboxCacheFileInfo(fileInfoArray) {
    /*private*/ function initFileInfoMap(fileInfoArray) {
        let map = {};
        for (let info of fileInfoArray) {
            assert.isDefined(info.url, `info.url`);
            assert.isDefined(info.revision, `info.revision`);
            map[info.url] = info.revision;
        }
        return map;
    }
    /*private*/ function getRelativeUrlFrom(url) {
        // Strip any parameters
        url = url.replace(/\?.*$/, '').trim();
        // Grab the relative URL
        let matches = url.match(/https?:\/\/[^/]*\/(.*)$/);
        assert.isDefined(matches, 'matches');
        return matches[1];
    }

    const FILE_INFO_MAP = initFileInfoMap(fileInfoArray);
    const WORKBOX_REVISION_PARAM = '__WB_REVISION__';

    this.getLatestRevisionFor = function (url) {
        let key = getRelativeUrlFrom(url);
        let revision = FILE_INFO_MAP[key];
        return revision;
    };
    this.hasLatestRevisionFor = function (url) {
        if (this.getLatestRevisionFor(url)) {
            return true;
        }
        return false;
    };
    this.addLatestRevisionParameterTo = function (url) {
        assert.isTrue(this.hasLatestRevisionFor(url), `Bug: No revision found for ${url}`);
        let revision = this.getLatestRevisionFor(url);
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
function WorkboxCacheFullyThenCacheOnly(serviceWorkerExecutionContext, cacheName, cacheFileInfoArray) {

    const CACHE_MATCH_OPTIONS = Object.freeze({ignoreSearch: true, ignoreVary: true});
    const CACHE_NAME = cacheName;
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

    /*private*/ function deleteOrphansFromCache(activationEvent) {
        // debug.log(`Deleting orphans from cache [${CACHE_NAME}]`);
        // debugger;
        activationEvent.waitUntil(
            caches.open(CACHE_NAME).then(function(cache) {
                cache.keys().then(function(keys) {
                    for (let response of keys) {
                        let cachedUrl = response.url;
                        let isCachedFileOrphan = !CACHE_FILE_INFO.hasLatestRevisionFor(cachedUrl);
                        if (isCachedFileOrphan) {
                            debug.log(`Deleting orphan response from [${CACHE_NAME}]:\n${cachedUrl}`);
                            cache.delete(cachedUrl, CACHE_MATCH_OPTIONS);
                        }
                    }
                });
            })
            .catch(function (error) {
                debug.error(`Problem deleting orphan(s) from cache '${CACHE_NAME}':\n${error}`);
            })
        );
    }
    // Tune in to the service worker lifecycle so we can manage our cache.
    serviceWorkerExecutionContext.addEventListener('activate', function(event) {
        deleteOrphansFromCache(event);
    });

    // Add the file to the cache if it has not already been added, or update the cache if a newer file exists
    // in the file revision data provided - wbCacheFileInfo
    /*private*/ addToCache = async function (url) {
        // debug.log(`Caching reponse in [${CACHE_NAME}] if necessary:\n${url}`);
        const cache = await caches.open(CACHE_NAME);
        assert.isTrue(cache, `Cannot open cache '${CACHE_NAME}'`);
        let alreadyCached = (await cache.match(url, CACHE_MATCH_OPTIONS));
        if (alreadyCached) {
            debug.log(`Response is already cached in [${CACHE_NAME}]:\n${url}`);
            let cachedRevision = CACHE_FILE_INFO.getRevisionParameterFrom(alreadyCached.url);
            // Handle previous version of code that did not use revision param.
            if (!cachedRevision) {
                debug.log(`NO VERSION INFO! Re-caching response in [${CACHE_NAME}]:\n${url}`);
                await cache.delete(url, CACHE_MATCH_OPTIONS);
                let urlToCache = CACHE_FILE_INFO.addLatestRevisionParameterTo(url);
                await cache.add(urlToCache);
            } else {
                let latestRevision = CACHE_FILE_INFO.getLatestRevisionFor(url);
                assert.isDefined(latestRevision, 'latestRevision', `Bug: Cannot find latest revision info for file: ${url}`);
                if (cachedRevision !== latestRevision) {
                    debug.log(`NEW VERSION DETECTED!\n - Cached revision: ${cachedRevision}\n - Latest revision: ${latestRevision}\nRe-caching response in [${CACHE_NAME}]:${url}`);
                    await cache.delete(url, CACHE_MATCH_OPTIONS);
                    let urlToCache = CACHE_FILE_INFO.addLatestRevisionParameterTo(url);
                    await cache.add(urlToCache);
                }
            }

        } else {
            debug.log(`NOT CACHED! Caching response fully in [${CACHE_NAME}]:\n${url}`);
            let urlToCache = CACHE_FILE_INFO.addLatestRevisionParameterTo(url);
            await cache.add(urlToCache);
        }
    };

    // The Workbox RouteHandler strategy interface method. So we can use an instance of this class as the second
    // argument to workbox.routing.registerRoute.
    // See https://developers.google.com/web/tools/workbox/modules/workbox-routing
    // TODO this is the only public method that this class really needs. Other methods are made public for testing purposes.
    this.handle = async function ({event, request}) {
        // debugger;
        await addToCache(request.url);
        debug.log(`Responding to request from cache [${CACHE_NAME}]:\n${request.url}`);
        return myCacheOnlyRouteHandler.handle({event, request});
    };

}