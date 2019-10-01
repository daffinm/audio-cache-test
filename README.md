# Audio Cache Test
Test project to find out how to get audio caching working with [Workbox](https://developers.google.com/web/tools/workbox), 
including scrub/seek.

This app is currently deployed on Firebase:

https://daffinm-test.firebaseapp.com/

## Latest news
* The problems described below all seem to happen when serving the app from Firebase and running in Chrome:
  ```
  Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36
  ```
* Everything seems to work fine (as expected) in Firefox:
  ```
   Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:69.0) Gecko/20100101 Firefox/69.0
  ```
Now testing on Windows 10/Chrome.
* Same issues on Windows as on Linux (Ubuntu 18.04):
```Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36```

## Background reading

See
* https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av 
* https://stackoverflow.com/questions/57903010/cannot-scrub-scroll-through-jplayer-audio-when-mp3-is-cached-by-workbox/57913561#57913561

## App setup
The app contains 4 audio elements. Once loaded from the network all audio should be cached *except* the file labelled 
'Not cached'. All audio labelled 'cached' should therefore be playable when offline (i.e. network cable unplugged). 
The un-cached audio file should only be playable when online. 

The 4 audio elements all have identical attributes except for ```src```:
```html
<audio controls 
    preload="metadata" 
    crossorigin="anonymous" 
    src="audio/[audio-file-name].mp3">
</audio>
```
##### Audio 1: Pre-cached (no router)
This is pre-cached using ```workbox injectManifest``` but it is not configured with a Workbox 
[range requests router](https://developers.google.com/web/tools/workbox/modules/workbox-range-requests).

The expectations for this audio therefore are:
* Should be playable online or offline.
* Should not be able to seek/scrub.

##### Audio 2: Pre-cached
This is also pre-cached using ```workbox injectManifest``` and configured with a Workbox range requests router.

The expectations for this audio therefore are:
* Should be playable online or offline.
* Should be able to seek/scrub.

##### Audio 3: Manually cached
This audio file is 'manually' cached using ```cache.add()``` with a router that uses the Workbox range requests plugin.

The expectations for this audio therefore are:
* Should be playable online or offline.
* Should be able to seek/scrub.

##### Audio 4: Not cached
This audio file is deliberately not cached using Workbox. 

The expectations for this audio therefore are:
* Should be playable online but not offline.
* Should be able to seek/scrub since file is being fetched directly from a server that will support range requests.

### Expected vs actual results

I am mostly using Chrome for testing and debugging:
```
Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36
```
These expectations are met when the app is served from a test server running on localhost. But when we [deploy the app 
to Firebase](https://daffinm-test.firebaseapp.com) strange things start happening... 

* Initially, when the app is first loaded from Firebase: 
  * All audio files appear enabled and are playable.
  * The pre-cached (no router) audio is scrubbable! (When served from a local, dev server, scrubbing is impossible, 
  which is what you would expect.)
  * Cached audio is all scrubbable. 
  * The un-cached audio is also scrubbable.
* If you then disconnect from the internet __without__ reloading the app:
  * The 1st audio file (pre-cached - no router) is playable for the first 6 seconds and you cannot scrub.
  * The 2nd audio file (pre-cached) is playable for about 20 seconds (no scrubbing).
  * The 3rd audio file (manually cached) is playable for about 36 seconds (no scrubbing).
  * The 4th audio file (not cached) is unplayable (as you would expect).
* If you then refresh the page:
  * Audio 1: playable and scrubbable. (Browser must be buffering it from the pre-cache.)
  * Audio 2: disabled! (unexpected)
  * Audio 3: disabled! (unexpected)
  * Audio 4: disabled.

## Editing, testing and debugging the app locally
1. Edit the files in the  ```www/``` directory.
1. Open a console in the project root, install the npm packages and run the local dev server:
   ```
   $ npm install
   $ npm start 
   ```
1. Run the build (syncs ```www/``` to ```www-deploy/```): 
   ```
   $ ./build
   ```
1. Goto http://localhost:8080

## Switch Workbox versions?
You can switch Workbox versions easily for testing purposes by updating 
```workbox-src/sw.js```

```$xslt
const WorkboxVersions = Object.freeze({
    V4: "4.3.1",
    V5: "5.0.0-beta.0"
});
const WORKBOX_DEBUG = true;
const WORKBOX_VERSION = WorkboxVersions.V4;
```
Currently, Workbox 4 seems more reliable. Cached audio files with range request routers 
are playable when the app is served from a local dev server (online of offline) and only become
problematic when you deploy to Firebase. 

On the other hand, with Workbox 5, cached audio
with range request routers are unplayable when served from localhost or Firebase (online or offline). 
