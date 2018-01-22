const { MockMethod } = require('./mock-method');

const weak_daemon_native = require('weak-daemon');
const WeakDaemon = weak_daemon_native.getClass();



class MockWeakDaemon extends WeakDaemon {
    
    constructor() {
        super(...arguments);
        this._started = false;
    }

    start() {
        this._started = true;
    }

    stop() {
        this._started = true;
    }

    isRunning() {
        return this._started;
    }
}



class LastInstanceof_MockWeakDaemon extends MockMethod {
    constructor() {
        super();
        this.last_instance = null;
    }

    mock() {        
        super.mock(weak_daemon_native, 'getInstance', this, this._getInstance);
    }

    _getInstance() {
        this._last_instance = new MockWeakDaemon(...arguments);
        return this._last_instance;
    }


    trigger() {
        this._last_instance._routine();
    }
}


module.exports.last_instanceof_weak_daemon = new LastInstanceof_MockWeakDaemon();
