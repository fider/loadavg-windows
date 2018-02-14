const {MockMethod} = require('./mock-method');
const {ok} = require('assert');





class MockDateNow {
    constructor() {
        this._nativeDateNow = global.Date.now;
        this._timestamp = 0;
    }

    /* --- Mocked methods --- */
    
    now() {
        return this._timestamp;
    }

    // no more Date methods needs to be mocked


    
    /* --- Mock controllers --- */

    get add() {
        this._mock();
        
        return {
            min: this.addMin.bind(this),
            sec: this.addSec.bind(this),
            ms: this.addMs.bind(this)
        }
    }


    min(minutes) {
        this._mock();
        this._timestamp = minutes * 60000;

        return {
            sec: this.addSec.bind(this),
            ms: this.addMs.bind(this)
        };
    }

    addMin(minutes) {
        this._mock();
        this._timestamp += minutes * 60000;

        return {
            sec: this.addSec.bind(this),
            ms: this.addMs.bind(this)
        };
    }


    sec(seconds) {
        this._mock();
        this._timestamp = seconds * 1000;

        return {
            ms: this.addMs.bind(this)
        };
    }

    addSec(seconds) {
        this._mock();
        this._timestamp += seconds * 1000;

        return {
            ms: this.addMs.bind(this)
        };
    }


    ms(millis) {
        this._mock();
        this._timestamp = millis;
    }

    addMs(millis) {   
        this._mock();     
        this._timestamp += millis;
    }


    reset() {
        global.Date.now = this._nativeDateNow;
        this._timestamp = 0;
    }

    _mock() {
        global.Date.now = this.now.bind(this);
    }
}

module.exports.time = new MockDateNow();
