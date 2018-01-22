const {MockMethod} = require('./mock-method');



class MockDateNow extends MockMethod {
    constructor() {
        super();

        this._now = 0;
    }

    mock() {
        super.mock(Date, 'now', this, this.now);
    }
    
    now() {
        return this._now;
    }

    set(timestamp) {
        this._now = timestamp;
    }
}


module.exports.now = new MockDateNow();
