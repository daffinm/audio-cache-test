
var __no_op = function() {};
var __no_op_object = {
    log: __no_op,
    error: __no_op,
    warn: __no_op,
    info: __no_op
};
// Default is no op.
var debug = self.debug = __no_op_object;
// Turn debug logging on/off here.
function setDebug(on, prefix, headerChar) {
    prefix = (prefix ? prefix : 'Debug Logger');
    headerChar = (headerChar ? headerChar : '😁');
    const sectionBar = headerChar.repeat(50);
    const sectionPrefix = headerChar.repeat(10);
    if (on) {
        debug = self.debug = {
            // log: window.console.log.bind(window.console, `[${prefix}] %s: %s`),
            section: self.console.log.bind(self.console, `${prefix}\n${sectionBar}\n${sectionPrefix} %s \n${sectionBar}`),
            log: self.console.log.bind(self.console, `${prefix} %s`),
            info: self.console.info.bind(self.console, `${prefix} %s`),
            warn: self.console.warn.bind(self.console, `${prefix} WARNING: %s`),
            error: self.console.error.bind(self.console, `${prefix} ERROR: %s`),
        };
    } else {
        debug = self.debug = __no_op_object;
    }
}

const assert = {
    isTrue: function (condition, failureMessage, data) {
        if(condition) return;
        if(assert.useDebugger) debugger; // Stop everything here and open the debugger.
        let theMessage = (failureMessage ? failureMessage : 'Assertion Failed!');
        theMessage = (arguments.length === 3 ? `${theMessage}: ${data}` : theMessage);
        throw new Error(theMessage);
    },
    isDefined: function (object, objectName, message) {
        let basicFailureMessage = `${objectName} is undefined/null`;
        let failureMessage = (message ? `${basicFailureMessage}\n${message}` : basicFailureMessage);
        assert.isTrue(
            !(typeof object === 'undefined' || object === null),
            failureMessage,
            object);
    },
    equals(expected, actual) {
        if (!(expected === actual)) {
            throw new Error(`assert equals failed!\n - expected: ${expected}\n - actual:   ${actual}`);
        }
    },
    fail(message) {
        throw new Error(message);
    }
};
