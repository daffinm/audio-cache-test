# Audio Cache Test
Test project to find out how to get audio scrub/seek working when using audio files that have been cached by the Service
Worker.

Project uses Workbox 4. 

See
* https://developers.google.com/web/tools/workbox/guides/advanced-recipes#cached-av 
* https://stackoverflow.com/questions/57903010/cannot-scrub-scroll-through-jplayer-audio-when-mp3-is-cached-by-workbox/57913561#57913561

## Updating the service worker
Edit ```./src/sw.js``` and then run ```./build``` to regenerate ```./www/sw.js```.