const {MockMethod} = require('./mock-method');
const {ok} = require('assert');


class MockDateNow extends MockMethod {
    constructor() {
        super();

        this._now = 0;
    }

    mock() {
        super.mock(Date, 'now', this, this._mockedNow);
    }
    
    _mockedNow() {
        return this._now;
    }

    set(timestamp) {
        ok(typeof timestamp === 'number');

        this._now = timestamp;
    }

    setMinSec(minutes, seconds) {
        ok(typeof minutes === 'number');
        ok(typeof seconds === 'number');

        this._now = minutes*60000 + seconds*1000;
    }

    setMin(minutes) {
        ok(typeof minutes === 'number');

        this._now = minutes*60000;
    }
}


module.exports.now = new MockDateNow();
