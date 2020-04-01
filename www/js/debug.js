
function Debug(on, prefix, headerChar) {
    prefix = (prefix ? prefix : 'Debug Logger');
    headerChar = (headerChar ? headerChar : '🕷️');
    const headingBorder = headerChar.repeat(60);
    this.turnOn = function (on) {
        if (on) {
            this.heading = self.console.log.bind(self.console, `${headingBorder}\n${prefix} %s \n${headingBorder}`);
            this.log     = self.console.log.bind(self.console, `${prefix} %s`);
            this.info    = self.console.info.bind(self.console, `${prefix} %s`);
            this.warn    = self.console.warn.bind(self.console, `${prefix} [WARNING] %s`);
            this.error   = self.console.error.bind(self.console, `${prefix} [ERROR] %s`);
            this.debug   = self.console.debug.bind(self.console, `${prefix} [DEBUG] %s`);
        }
        else {
            this.heading = function(){};
            this.log =     function(){};
            this.info =    function(){};
            this.warn =    function(){};
            this.error =   function(){};
            this.debug =   function(){};
        }
    };
    this.turnOn(on);
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
