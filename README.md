# Audio Cache Test
Test project to find out how to get audio caching working with [Workbox](https://developers.google.com/web/tools/workbox), 
including scrub/seek.

Once loaded the app should work when fully offline (i.e. network cable unplugged). That is, the cached audio files should 
still be playable whilst the un-cached audio file should not be playable. However, all audio files are currently unplayable
when the app is offline, even when the cached audio files are clearly present in the Workbox caches.

Project currently uses Workbox 4. 

See
* https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av 
* https://stackoverflow.com/questions/57903010/cannot-scrub-scroll-through-jplayer-audio-when-mp3-is-cached-by-workbox/57913561#57913561

## Updating the service worker
Edit ```./src/sw.js``` and then run ```./build``` to regenerate ```./www/sw.js```.

## Firebase Hosting
You can find a running copy of this project at:

https://daffinm-test.firebaseapp.com/