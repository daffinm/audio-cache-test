const SW_SCRIPT_URL = '/sw.js';
const SwClient = {
    sendMessageToUser(message) {
        let $messageBoard = $('#message-board');
        $messageBoard.html(`<p style="display: none;">${message}</p>`);
        let $message = $('#message-board p');
        $message.fadeIn();
        setTimeout(function () {
            $message.fadeOut();
        }, 5000);
        // alert(message);
    },
    // -----------------------------------------------------------------------------------------------------------------
    // Call this before you do anything else.
    // -----------------------------------------------------------------------------------------------------------------
    registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        // Reload once when the new Service Worker starts activating
        debug.log('Adding controllerchange listener.');
        let refreshing = false;
        navigator.serviceWorker.oncontrollerchange = function(controllerchangeevent) {
            if (refreshing) return;
            debug.warn('controllerchange >> refreshing page!');
            refreshing = true;
            window.location.reload();
        };

        function promptUserToRefreshIfNecessary(reg) {
            SwClient._logRegistration(reg, 'promptUserToRefreshIfNecessary');
            let newServiceWorker = (reg.installing || reg.waiting);
            assert.isDefined(newServiceWorker, 'newServiceWorker');
            let activeServiceWorker = reg.active;
            if (activeServiceWorker) {
                debug.log('Active Service Worker already installed. This is an update. Prompting user...');

                if (confirm(`An update is available for this app. Use it now?`)) {
                    debug.log("User wishes to use update NOW.");
                    SwClient.sendMessageToUser('Installing update...');
                    // See https://github.com/GoogleChrome/workbox/issues/2411#issuecomment-604505853
                    if (!navigator.serviceWorker.controller) {
                        setTimeout(function () {
                            window.location.reload();
                        }, 2000);
                    }
                    return sendMessageToServiceWorker(newServiceWorker, MESSAGES.SKIP_WAITING);
                }
                else {
                    debug.log("User wishes to update LATER");
                }
            }
            else {
                debug.log(`Not prompting user:\n - No active Service Worker found.\n - Service Worker is being installed for the first time.\n - Activation should be automatic.`);
            }
        }
        const MESSAGES = Object.freeze({
            SKIP_WAITING: 'SKIP_WAITING',
        });
        function sendMessageToServiceWorker(serviceWorker, message) {
            let data = {message: message};
            serviceWorker.postMessage(data);
        }

        function handleRegistration(reg, callbackWaitingServiceWorkerFound) {
            assert.isDefined(reg, 'reg');
            SwClient._logRegistration(reg, 'handleRegistration()');

            function awaitStateChange() {
                reg.installing.addEventListener('statechange', function() {
                    SwClient._logRegistration(reg, `statechange: [${this.state}]`);
                    if (this.state === 'installed') callbackWaitingServiceWorkerFound(reg);
                });
            }
            // =========================================================================================================
            // This is the crux, right here.
            // =========================================================================================================
            if (reg.waiting) return callbackWaitingServiceWorkerFound(reg);
            if (reg.installing) awaitStateChange();
            reg.addEventListener('updatefound', awaitStateChange);
        }

        function doRegister(scriptURL) {
            return new Promise(function (resolve, reject) {
                navigator.serviceWorker.register(scriptURL)
                    .then(reg => {
                        if (reg) {
                            SwClient._logRegistration(reg, `Success! Registered/re-connected to: ${scriptURL}`);
                            handleRegistration(reg, promptUserToRefreshIfNecessary);
                            resolve(reg);
                        } else {
                            reject(new Error('Failed to register Service Worker. No idea why...'));
                        }
                    })
                    .catch(function (err) {
                        debug.error(`Cannot register/re-connect to service worker: ${scriptURL}`, err);
                        reject(err);
                    });
            });
        }
        function addCheckForUpdatesButtonToMainScreen() {
            let buttonAlreadyAdded = $('#update').length === 1;
            if (!buttonAlreadyAdded) {
                const $updateButton = $(`<button id="update">Check for Updates...</button>`);
                $updateButton.on('click', function () {
                    SwClient.checkForUpdates();
                });
                $('#buttons').append($updateButton);
            }
        }
        function promptUserToInstall(deferredInstallationPrompt) {
            deferredInstallationPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredInstallationPrompt.userChoice
                .then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        debug.log('User accepted the A2HS prompt');
                    } else {
                        debug.log('User dismissed the A2HS prompt');
                    }
                    deferredInstallationPrompt = null;
                });
        }
        function addInstallationButtonToMainScreen(deferredInstallationPrompt) {
            if (!deferredInstallationPrompt.prompt) {
                throw new Error('BUG: event lacks prompt() method!');
            }
            const $installButton = $(`<button id="install">Check for Updates</button>`);
            $installButton.on('click', function () {
                promptUserToInstall(deferredInstallationPrompt);
            });
            $('#buttons').append($installButton);
        }
        function removeInstallationButtonFromMainScreen() {
            $('#install').remove();
        }
        function addInstallationEventListenersToWindow() {
            // App installation - adding to desktop. Works in Mobile Chrome. May eventually work in other Browsers...
            window.addEventListener('beforeinstallprompt', (e) => {
                debug.log('[beforeinstallprompt] UpLift is now installable!');
                // Stash the event so it can be triggered later.
                addInstallationButtonToMainScreen(e);
            });
            // This event is fired prematurely in Chrome on Android.
            // See https://stackoverflow.com/questions/60320837/appinstalled-event-is-fired-prematurely
            window.addEventListener('appinstalled', (e) => {
                debug.log('[appinstalled] UpLift has been installed successfully!');
                SwClient.sendMessageToUser('App has been added to your home screen. Close this window and re-launch using the icon.');
                removeInstallationButtonFromMainScreen();
            });
        }
        function addUpdatePoller() {
            const FIFTEEN_SECONDS = 5 * 1000;
            const FIVE_MINUTES = 5 * 60 * 1000;
            const ONE_HOUR = 60 * 60 * 1000;
            const POLLING_INTERVAL = ONE_HOUR;
            const UPDATE_CHECK_INTERVAL = setInterval(function() {
                SwClient.checkForUpdates(true);
            }, POLLING_INTERVAL);
        }

        function main() {
            doRegister(SW_SCRIPT_URL)
                .then(function (reg) {
                    addCheckForUpdatesButtonToMainScreen();
                    addInstallationEventListenersToWindow();
                    addUpdatePoller();
                })
                .catch(function (error) {
                    debug.error('Problem registering service worker', error);
                });
        }
        main();
    },
    // -----------------------------------------------------------------------------------------------------------------
    // Check for Updates... (Register needs to be called first each time the app reloads for this to work.)
    // -----------------------------------------------------------------------------------------------------------------
    checkForUpdates(headless) {
        if (!('serviceWorker' in navigator)) return;

        function doCheckForUpdates(scriptURL) {
            debug.log(`Checking for updates: ${scriptURL}`);
            // navigator.serviceWorker.getRegistration(scriptURL)
            navigator.serviceWorker.register(scriptURL)
                .then(reg => {
                    if (reg) {
                        SwClient._logRegistration(reg, `Got registration for ${scriptURL}`);
                        if (!headless) {
                            SwClient.sendMessageToUser(`Checking for updates.... I'll let you know if I find some :-)`);
                        }
                        reg.update()
                            .then(function (reg) {
                                if (reg.installing || reg.waiting) {
                                    if (reg.active) {
                                        debug.log(`Update found! (I hope you remembered to register again.)`);
                                        // If registration has happened, and listeners have been added to the existing reg,
                                        // then we don't need to do anything else. If we prompt the user here then we run
                                        // the risk of duplicating actions that the listeners will take. So, this is only
                                        // a problem if registration has not occurred before this method is called.
                                    } else {
                                        debug.log('New installation. Activation should be automatic.');
                                    }
                                }
                                else {
                                    debug.log('No updates found!');
                                    if (!headless) {
                                        SwClient.sendMessageToUser(`You are already on the latest version of this app.`);
                                    }
                                }
                            })
                            .catch(function (err) {
                                debug.warn('Error updating registration: ', err);
                                if (!headless) {
                                    SwClient.sendMessageToUser('Cannot check for updates at the moment. Are you offline?');
                                }
                            });
                    } else {
                        debug.warn(`Cannot get registration for ${scriptURL}`);
                        debug.warn(`I guess it's not been registered or is not not running...`);
                        // SwClient.registerServiceWorker();
                    }
                })
                .catch(function (err) {
                    debug.error(`FAIL! Cannot register/re-connect to service worker: ${scriptURL}`, err);
                });
        }

        function main() {
            doCheckForUpdates(SW_SCRIPT_URL);
        }

        main();
    },
    // -----------------------------------------------------------------------------------------------------------------
    // Pseudo private/shared methods
    // -----------------------------------------------------------------------------------------------------------------
    _logRegistration(reg, message) {
        function toString(serviceWorker) {
            const yes = '✓';
            const no = '𐄂';
            return `${serviceWorker ? `${yes} ${serviceWorker.scriptURL}` : no}`;
        }
        if (!reg) {
            debug.error(`${message}: registration is undefined/null: `, reg);
            return;
        }
        message = (message ? message : `Registration details: ${reg.scope}`);
        let lines = `${message}\n- installing: ${toString(reg.installing)}\n- waiting:    ${toString(reg.waiting)}\n- active:     ${toString(reg.active)}`;
        debug.log(lines);
    },
};

// window.addEventListener('load', function() {
//     debug.warn('Registering Service Worker now, here.');
    SwClient.registerServiceWorker();
// });
