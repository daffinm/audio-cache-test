# Audio Cache Test
Test project to find out how to get audio caching working with [Workbox](https://developers.google.com/web/tools/workbox), 
including scrub/seek.

Once loaded the app should work when fully offline (i.e. network cable unplugged). That is, the cached audio files should 
still be playable whilst the un-cached audio file should not be playable. 

These expectations are met when the app is served
from a test server running on localhost. But when we deploy the app to firebase all audio files are currently unplayable
when the app is offline, even when the cached audio files are clearly present in the Workbox caches.

Project currently uses Workbox 4. 

See
* https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av 
* https://stackoverflow.com/questions/57903010/cannot-scrub-scroll-through-jplayer-audio-when-mp3-is-cached-by-workbox/57913561#57913561

## Updating the service worker
Edit ```./src/sw.js``` and then run ```./build``` to regenerate ```./www/sw.js```.

## Running on localhost:8080
```$xslt
npm start
```
Then go to http://localhost:8080

## Firebase Hosting
You can find a running copy of this project at:

https://daffinm-test.firebaseapp.com/

## Tests
#### Localhost
1. Run server and goto http://localhost:8080
1. Play all 6 audio files.
   * Expected: all files play and you can seek/scrub in all cases.
   * Actual: as expected.
1. Shutdown local server and refresh page.
   * Expected: page is loaded from cache.
   * Actual: as expected.
1. Play all 6 audio files.
   * Expected: Cached files play. Uncached file does not play. (In Chrome, unplayable/loadable audio files have audio 
   controls disabled.)
   * Actual: as expected.
#### Firebase
1. Goto https://daffinm-test.firebaseapp.com
1. Play all 6 audio files.
   * Expected: all files play and you can seek/scrub in all cases.
   * Actual: as expected first time I access the page. But when I refresh cached files are no longer playable or are 
   only parly playable (like they are partly buffered somewhere).  Uncached file is still playable which shows that Firebase
   is not the problem (I think...).
1. Disconnect from the internet and refresh page: 
   * Expected: page is loaded from cache.
   * Actual: as expected.
1. Play all 6 audio files.
   * Expected: cached files play. Uncached file does not play.
   * Actual: all files are unplayable. In the console log we see the same error for all cached files (mp3 or m4a):
    ```$xslt
    logger.mjs:44 workbox Router is responding to: /audio/m4a/pre-cached.m4a
    logger.mjs:44 workbox Using CacheOnly to respond to '/audio/m4a/pre-cached.m4a'
    The FetchEvent for "https://daffinm-test.firebaseapp.com/audio/m4a/pre-cached.m4a" resulted in a network error response: the promise was rejected.
    Promise.then (async)
    (anonymous) @ Router.mjs:60
    CacheOnly.mjs:115 Uncaught (in promise) no-response: The strategy could not generate a response for 'https://daffinm-test.firebaseapp.com/audio/m4a/pre-cached.m4a'.
        at CacheOnly.makeRequest (https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-strategies.dev.js:343:15)
    WorkboxError @ WorkboxError.mjs:33
    makeRequest @ CacheOnly.mjs:115

    ```
