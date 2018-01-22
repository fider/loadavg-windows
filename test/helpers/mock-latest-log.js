const { MockMethod } = require('./mock-method');

class MockLatestLog extends MockMethod {
    constructor() {
        super();
        this._last_log = '';
    }

    mock() {
        super.mock(console, 'log', this, this._log);
    }

    clean() {
        this._last_log = '';
    }

    get() {
        return this._last_log;
    }

    _log(...args) {
        this._last_log = args.join('\n');
    }
}

module.exports.latest_log = new MockLatestLog();
