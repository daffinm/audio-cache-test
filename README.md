# Media Cache Test
PWA test project to find out how to get audio caching working with [Workbox](https://developers.google.com/web/tools/workbox), 
including scrub/seek using the [range requests plugin](https://developers.google.com/web/tools/workbox/modules/workbox-range-requests).

Workbox caching is great unless you want to cache media (audio/video). Then it gets complex, and things start not working, 
and you begin to wonder if you will ever get your PWA working with cached media, or if
you made some hideous mistake by ever thinking that this was a good idea...

The good news is that I now have a solution to caching media with Workbox. It caches media at runtime so the user can
play it offline. This sounds simple but it took quite a bit of figuring out, and I think I may be the first person to make it work
in this context. 

If you would like to get a flavour of the road to this solution see the following threads:

* Stackoverflow:
  * [Cannot scrub/scroll through jPlayer audio when mp3 is cached by Workbox](https://stackoverflow.com/questions/57903010/cannot-scrub-scroll-through-jplayer-audio-when-mp3-is-cached-by-workbox)
  * [Workbox pre-cached audio with range requests router fails to play in Chrome when served from Firebase](https://stackoverflow.com/questions/58270383/workbox-pre-cached-audio-with-range-requests-router-fails-to-play-in-chrome-when)
  * [Inconsistent behaviour with workbox-window.update](https://stackoverflow.com/questions/58670453/inconsistent-behaviour-with-workbox-window-update) 
* Workbox project on Github:
  * [Runtime caching strategy needed for media?](https://github.com/GoogleChrome/workbox/issues/2382)

I have also published my code for handling service worker updates gracefully. Not perfect, but it works. Background to 
this part is as follows:
* [Inconsistent behaviour with workbox-window.update()](https://stackoverflow.com/questions/58670453/inconsistent-behaviour-with-workbox-window-update)
* [Unexpected behavior with workbox-window when used with registration.update()](https://github.com/GoogleChrome/workbox/issues/2031)


## Goals for this project

* I want the app to cache all media (audio/video) and for this media to be playable offline, including scrub/seek.
* I want to be able to update cached media easily, including removal of orphan files (stuff that has been removed from
the app).

## Implementation

I began by precaching all media. This can be done in one of two ways:
1. Using [Workbox injectManifest](https://developers.google.com/web/tools/workbox/modules/workbox-cli#injectmanifest).
1. By manually adding audio files to a cache using ```cache.add(URL)```

Precaching media works fine (once you know how). But it is not very user friendly for people on slow mobile data 
connections, or who have limited data. The first time they click a link to your site it will cost them a ton of data, and the app will take ages to load up.
So really we want runtime caching for media. But this is not possible with Workbox 'out of the box'.

The solution is to leverage Workbox to intercept requests for media, cache the media fully, and then serve it
from the cache. So the first time you click play on something it takes a while if you are on a slow internet 
 connection. Subsequently, however, it takes no time at all. And you can run offline.

## Editing, testing and debugging the app locally
At the moment the build uses a bash script. Apologies for that. I will migrate it to gulp asap.

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