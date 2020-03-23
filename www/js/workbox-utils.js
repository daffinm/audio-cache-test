function WorkboxCacheFileInfo(fileInfoArray) {
    const FILE_INFO_ARRAY = fileInfoArray;
    function initFileInfoMap() {
        let map = {};
        for (let info of FILE_INFO_ARRAY) {
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
    const FILE_INFO_MAP = initFileInfoMap();
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
    const WORKBOX_REVISION = '__WB_REVISION__';
    this.addLatestRevisionParameterTo = function (url) {
        assert.isTrue(this.hasLatestRevisionFor(url), `Bug: No revision found for ${url}`);
        let revision = this.getLatestRevisionFor(url);
        return `${url}?${WORKBOX_REVISION}=${revision}`;
    };
    this.getRevisionParameterFrom = function (url) {
        let regex = new RegExp(`https?:\/\/[^/]*\/(.*)\?${WORKBOX_REVISION}=(.*$)`);
        let matches = url.match(regex);
        if (matches) {
            return matches[2];
        }
        return null;
    };
}
const WbUtils = {
    matchOptions: Object.freeze({ignoreSearch: true, ignoreVary: true}),
    deleteOrphansFromCache(activationEvent, cacheName, wbCacheFileInfo) {
        activationEvent.waitUntil(
            caches.open(cacheName).then(function(cache) {
                cache.keys().then(function(keys) {
                    for (let response of keys) {
                        let cachedUrl = response.url;
                        let isCachedFileOrphan = !wbCacheFileInfo.hasLatestRevisionFor(cachedUrl);
                        if (isCachedFileOrphan) {
                            cache.delete(cachedUrl, WbUtils.matchOptions);
                        }
                    }
                });
            })
            .catch(function (error) {
                debug.error(`Problem deleting orphan(s) from cache '${cacheName}':\n${error}`);
            })
        );
    },
    // Add file to the specified cache if it has not already been added, or update the cache if a newer file exists in this build.
    async addToCache(url, cacheName, wbCacheFileInfo) {
        assert.isDefined(url, 'url');
        assert.isDefined(cacheName, 'cacheName');
        assert.isDefined(wbCacheFileInfo, 'wbCacheFileInfo');
        const cache = await caches.open(cacheName);
        assert.isTrue(cache, `Cannot open cache '${cacheName}'`);
        let alreadyCached = (await cache.match(url, WbUtils.matchOptions));
        if (alreadyCached) {
            let cachedRevision = wbCacheFileInfo.getRevisionParameterFrom(alreadyCached.url);
            // Handle previous version of code that did not use revision param.
            if (!cachedRevision) {
                await cache.delete(url, WbUtils.matchOptions);
                let urlToCache = wbCacheFileInfo.addLatestRevisionParameterTo(url);
                await cache.add(urlToCache);
            }
            else {
                let latestRevision = wbCacheFileInfo.getLatestRevisionFor(url);
                assert.isDefined(latestRevision, 'latestRevision', `Bug: Cannot find latest revision info for file: ${url}`);
                if (cachedRevision !== latestRevision) {
                    await cache.delete(url, WbUtils.matchOptions);
                    let urlToCache = wbCacheFileInfo.addLatestRevisionParameterTo(url);
                    await cache.add(urlToCache);
                }
            }

        } else {
            let urlToCache = wbCacheFileInfo.addLatestRevisionParameterTo(url);
            await cache.add(urlToCache);
        }
    }
};
