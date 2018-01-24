const { MockMethod } = require('./mock-method');

const weak_daemon_native = require('weak-daemon');
const WeakDaemon = weak_daemon_native.getClass();



class StubWeakDaemon extends WeakDaemon {
    
    constructor() {
        super(...arguments);
        this._started = false;
    }

    start(immediate_call = false) {
        if(immediate_call) {
            this._routine();
        }
        this._started = true;
    }

    stop() {
        this._started = true;
    }

    isRunning() {
        return this._started;
    }

    trigger() {
        this._routine();
    }
}



class WeakDaemonHunter extends MockMethod {
    constructor() {
        super();
        this._weak_daemon = null;
    }

    startHunting() {        
        super.mock(weak_daemon_native, 'getInstance', this, this._captureInstance);
    }

    stopHunting() {
        this._errorIfNotCaptured();
        this._weak_daemon = null;
        super.reset();
    }


    get() {
        this._errorIfNotCaptured();
        return this._weak_daemon;
    };

    
    _captureInstance() {
        this._errorIfAlreadyCaptured();
        this._weak_daemon = new StubWeakDaemon(...arguments);
        return this._weak_daemon;
    };

    
    _errorIfAlreadyCaptured() {
        if(this._weak_daemon) {
            throw new Error(`
                WeakDaemonHunter assumes that only one instance can be captured during single hunt
            `);
        }
    }


    _errorIfNotCaptured() {
        if( ! this._weak_daemon) {
            throw new Error(`No instance of WeakDaemon captured!

                To capture last instance you have to fulfill below points:
                1) call "hunter.startHunting()"
                2) create "WeakDaemon" instance using "require('weak-daemon').getInstance" function
                3) call "instance = hunter.get()"
                4) call "hunter.stopHunting()"

                If succed then you can:
                - call "${this.constructor.name}.trigger()" to call routine assigned to captured weak daemon instance
                - to get captured instance: "last_instance = ${this.constructor.name}.get()"
                `);
        }
    }
}


module.exports.weak_daemon_hunter = new WeakDaemonHunter();
