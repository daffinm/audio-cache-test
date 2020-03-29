# Media Cache Test
[PWA](https://en.wikipedia.org/wiki/Progressive_web_application) test project to find out how to get audio caching working with [Workbox](https://developers.google.com/web/tools/workbox), 
including scrub/seek using the [range requests plugin](https://developers.google.com/web/tools/workbox/modules/workbox-range-requests).
---
__Note:__ the version on this branch uses the same caching strategy to handle runtime caching of all 
resources in the app except the bare bones - index.html etc. It seems highly performant in Lighthouse.
---
Workbox caching is great unless you want to cache media (audio/video). Then it gets complex, and things start not working, 
and you begin to wonder if you will ever get your PWA working with cached media, or if
you made some hideous mistake by ever thinking that this was a good idea...

The good news is that I now have a solution to caching media with Workbox. It caches media at runtime so the user can
play it offline. This sounds simple but it took quite a bit of figuring out, and I think I may be the first person to make
media caching work in this context - judging by the lack of information or seeming interest in this subject). 

If you would like to get a flavour of the road to this solution see the following threads:

* Stackoverflow:
  * [Cannot scrub/scroll through jPlayer audio when mp3 is cached by Workbox](https://stackoverflow.com/questions/57903010/cannot-scrub-scroll-through-jplayer-audio-when-mp3-is-cached-by-workbox)
  * [Workbox pre-cached audio with range requests router fails to play in Chrome when served from Firebase](https://stackoverflow.com/questions/58270383/workbox-pre-cached-audio-with-range-requests-router-fails-to-play-in-chrome-when)
* Workbox project on Github:
  * ["There's unfortunately a lot of nuance needed to get this fully working with any service worker implementation"](https://github.com/GoogleChrome/workbox/issues/1663#issuecomment-430788996)
  * [Runtime caching strategy needed for media?](https://github.com/GoogleChrome/workbox/issues/2382)

I have also published my code for handling service worker updates gracefully. Not perfect, but it works, and you'll get the idea. 

Background to 
this part is as follows:
  * [Inconsistent behaviour with workbox-window.update](https://stackoverflow.com/questions/58670453/inconsistent-behaviour-with-workbox-window-update) 
* [Unexpected behavior with workbox-window when used with registration.update()](https://github.com/GoogleChrome/workbox/issues/2031)

See [SwClient.js](https://github.com/daffinm/audio-cache-test/blob/master/www/js/sw-client.js) for details.


## Goals for this project

* I want the app to cache all media (audio/video) and for this media to be playable offline, including scrub/seek.
* I want to be able to update cached media easily, including removal of orphan files (stuff that has been removed from
the app).

## Implementation

I began by precaching all media. This can be done in one of two ways:
1. Using [Workbox injectManifest](https://developers.google.com/web/tools/workbox/modules/workbox-cli#injectmanifest).
1. By manually adding audio files to a cache using ```cache.add(URL)``` (see [here](https://github.com/GoogleChrome/workbox/issues/1663#issuecomment-450999270))

Precaching media works fine (once you know how to make it work). 
1. Generate a list of media files to precache using `injectManifest`
1. [Register a route](https://developers.google.com/web/tools/workbox/modules/workbox-routing) with Workbox that intercepts
requests for media and routes them to the precache via a handler that is configured to deal with range requests. 

But precaching media it is not very user-friendly for people on slow mobile data connections, or who have limited data. 
The first time they click a link to your site they will get a lot more data than they may have bargained for, 
and the app will take ages to load up because your bandwidth will be used up by the service worker as it installs and loads
the precache. 

What we really want is runtime caching for media. But this is not possible with Workbox 'out of the box' because we are
dealing with partial range requests. "Please just give me a bit of this file, not the whole thing...' And we can't cache
bits of files. It just won't work. 

The solution is to leverage Workbox to intercept requests for media, ignore the range part of the request, cache the 
media fully, and then serve it from the cache. So the first time you click play it takes a while if you are on a slow internet 
 connection. Subsequently, however, it takes no time at all. And you can run offline. (I am using a customised version of 
 and old project called [CirclePlayer](https://github.com/maboa/circleplayer) with a [CSS loading spinner](https://projects.lukehaas.me/css-loaders/) to get round this.)

#### Keeping the cache up to date
 
Once you have managed to cache media the next question is: how do we keep the cached media up to date, 
or get rid of media files that are no longer part of the app, or are out of scope in some way?

The simplest solution I could think of (the one you will find here) leverages Workbox `injetManifest` to generate
revision information for media files and inject this into your service worker. Cached media is annotated with this
revision information so that you can tell when a runtime-cached media file (or any other file cached using this
strategy) has been updated in a new build of your PWA. 

The code is all documented, or self-documenting. I hope that you can make sense of it, and that you find it useful.
And if you can think of any improvements please suggest them in the usual manner.

See:

1. [sw.js](https://github.com/daffinm/audio-cache-test/blob/master/www/js/sw.js)
1. [workbox-utils.js](https://github.com/daffinm/audio-cache-test/blob/master/www/js/workbox-utils.js)

#### What do you call it?

So this project uses a new caching strategy which you could call 'CacheFullyFirst' or 'CachBeforeCacheOnly'. Not sure. 
What does it do?

1. It caches resources at runtime - on-demand. 
1. It seems to be able to handle pretty much any kind of resource, including media (audio/video).
1. It caches any resource in scope (see below) fully the first time it is is requested and serves this resource using a 
[CacheOnly strategy](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_only) from then on.
1. Leverages [Workbox injectManifest](https://developers.google.com/web/tools/workbox/modules/workbox-cli#injectmanifest) 
to build a runtime manifest of all the files in the app that we want to cache eventually. This enables us:
   * To remove orphaned files: At startup, any cached files that do no appear in the runtime manifest are deleted from the cache.  
   * To detect updates easily: If the revision of a cached file has changed then the cache is updated with the new version.

##### Media element settings
Note that the media elements are configured as follows: 
1. `preload=none`: 
   * Because I want to delay caching until the user actually wants to play something.
   * Because this setting is best if you have a page containing multiple media elements. If you use
   `preload=metadata` with multiple media elements you end up fighting for bandwidth and causing 
   performance issues.
   * Also it seems that using `preload=metadata` (in Chrome at least) sometime results in the caching being bypassed. 
   Sometimes, at pageload, the metadata request is intercepted by the service worker and the media file is cached. And
   other times it seems that Chrome caches the media file and no further requests are received for it. So if you want
   consistent results use `preload=none` .
1. `crossorigin=anonymous`: 
   * Because this is needed to get caching working. Not exactly sure why. 
   * See [this thread with Jeff Posnick](https://stackoverflow.com/questions/57903010/cannot-scrub-scroll-through-jplayer-audio-when-mp3-is-cached-by-workbox) for more information.
1. Timestamp appended to end of src to facilitate testing. (See note in index.html)  

## Editing, testing and debugging the app locally
At the moment the build uses a bash script. Apologies for that. I will migrate it to gulp ASAP. (So much has happened
since I last put on coding gloves. it was all [Apache Ant](https://ant.apache.org/) back then...)

So, for now:

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

## Firebase
You can also take a look at the running app here, on Firebase:

http://daffinm-test.firebaseapp.com