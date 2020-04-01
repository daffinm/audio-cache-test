// See https://developers.google.com/web/tools/workbox/guides/advanced-recipes#offer_a_page_reload_for_users
import {Workbox, messageSW} from 'https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-window.prod.mjs';

const SwClientV2 = {
    registerServiceWorker() {

        if (!'serviceWorker' in navigator) return;

        // -------------------------------------------------------------------------------------------------------------
        // UI methods
        // -------------------------------------------------------------------------------------------------------------
        function listenForServiceWorkerActivation() {
            navigator.serviceWorker.ready.then(() => {
                // When a new service worker has finished installing and become active.
                // i.e. after precaching etc has completed.
                debug.log('Service worker is fully installed and activated!');
            });
        }
        function sendMessageToUser(message, warning) {
            let $messageBoard = $('#message-board');
            message = (warning ? `<span class="warning">${message}</span>` : message);
            $messageBoard.html(`<p style="display: none;">${message}</p>`);
            let $message = $('#message-board p');
            $message.fadeIn();
            setTimeout(function () {
                $message.fadeOut();
            }, 5000);
        }
        function promptUserToUpdate({onAccept, onReject, manual}) {
            if (confirm(`An update is available for this app.\nUse it now?\n(manual=${manual})`)) {
                onAccept();
            }
            else {
                onReject();
            }
        }

        // -------------------------------------------------------------------------------------------------------------
        // Non-ui methods
        // -------------------------------------------------------------------------------------------------------------
        function reloadWhenControllerChanges(wb) {
            // TODO this listener seems to go stale - to stop working. It's unreliable.
            // wb.addEventListener('controlling', (event) => {
            //     sendMessageToUser('Reloading application...');
            //     debugger;
            //     setTimeout(function () {
            //         window.location.reload();
            //     }, 2000);
            // });
            // TODO whilst this one never fails. Need to report this.
            navigator.serviceWorker.oncontrollerchange = function(e) {
                sendMessageToUser('Reloading application...', true);
                setTimeout(function () {
                    window.location.reload();
                }, 3000);
            };
        }

        let updateAlreadyFound = false;
        function handleUpdateFound(newServiceWorker, manual) {
            debug.log(`Handling update: manual=${manual}`);
            // Gate this because can be called from a waiting listener or because a button has been pressed.
            if (!manual && updateAlreadyFound) {
                return;
            }
            updateAlreadyFound = true;
            promptUserToUpdate({
                onAccept: async () => {
                    messageSW(newServiceWorker, {message: 'SKIP_WAITING'});
                },
                onReject: () => {
                    sendMessageToUser('The update will be activated later.');
                },
                manual: manual
            });
        }
        function checkForUpdates(wb, headless) {
            if (!headless) sendMessageToUser(`Checking for updates.... I'll let you know if I find some :-)`);
            wb.update().then(function () {
                let reg = wb.p;
                let newServiceWorker = (reg.installing || reg.waiting);
                if (newServiceWorker) {
                    handleUpdateFound(newServiceWorker, true);
                }
                else {
                    if (!headless) sendMessageToUser('You are already on the latest version of this app.')
                }
            });
        }
        function addUpdatePoller(wb) {
            const FIFTEEN_SECONDS = 5 * 1000;
            const FIVE_MINUTES = 5 * 60 * 1000;
            const ONE_HOUR = 60 * 60 * 1000;
            const POLLING_INTERVAL = ONE_HOUR;
            const UPDATE_CHECK_INTERVAL = setInterval(function() {
                checkForUpdates(wb, true);
            }, POLLING_INTERVAL);
        }
        function addCheckForUpdatesButtonToUI(wb) {
            let buttonAlreadyAdded = $('#update').length === 1;
            if (!buttonAlreadyAdded) {
                const $updateButton = $(`<button id="update">Check for Updates...</button>`);
                $updateButton.on('click', function () {
                    checkForUpdates(wb, false);
                });
                $('#buttons').append($updateButton);
            }
        }
        // Add an event listener to detect when the registered
        // service worker has installed but is waiting to activate.
        function listenForWaitingServiceWorker(wb) {
            function handleWaitingEvent(e, type) {
                debug.log(`New service worker is [${e.type}]`);
                let reg = e.target.p;
                let newServiceWorker = (reg.installing || reg.waiting);
                handleUpdateFound(newServiceWorker, false);
            }
            wb.addEventListener('waiting', function (e) {
                handleWaitingEvent(e);
            });
            wb.addEventListener('externalwaiting', function (e) {
                handleWaitingEvent(e);
            });
        }

        // =============================================================================================================
        // The main method.
        // =============================================================================================================
        function main() {
            const wb = new Workbox('/sw.js');
            listenForServiceWorkerActivation();
            reloadWhenControllerChanges(wb);
            addCheckForUpdatesButtonToUI(wb);
            addUpdatePoller(wb);
            listenForWaitingServiceWorker(wb);
            // Now you can register.
            wb.register();
        }

        main();
    }
};
SwClientV2.registerServiceWorker();