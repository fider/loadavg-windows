// const {MockMethod} = require('./mock-method');
const {ok} = require('assert');
const os = require('os');



class MockCpuTimes {
    constructor() {
        // Members
        this._cpus = [];
        this._nativeCpus = os.cpus;

        // Data init
        let cpus = os.cpus();
        for(let [i, cpu] of cpus.entries()) {
            this._cpus[i] = {
                model: cpu.model,
                speed: cpu.speed,
                times: {
                    idle: 0,
                    user: 0,
                    nice: 0,
                    sys:  0,
                    irq:  0
                }
            }
        }
        this._cpu_no = 0;
    }

    
    zero() {
        for(let cpu of this._cpus) {
            cpu.times = {
                idle: 0,
                user: 0,
                nice: 0,
                sys:  0,
                irq:  0
            }
        }
    }



    busy(millis) {
        this._mock();
        this.zero();
        this._addBusy(millis);

        return {
            idle: this._addIdle.bind(this)
        }
    }    

    idle(millis) {
        this._mock();
        this.zero();
        this._addIdle(millis);

        return {
            busy: this._addBusy.bind(this)
        }
    }



    _addIdle(millis) {
        let parts = this._splitToRandomParts(millis);
        parts.forEach( (part) => {
            this._addIdleToRandomCpu(part);
        });
    }

    _addBusy(millis) {
        let parts = this._splitToRandomParts(millis);
        parts.forEach( (part) => {
            this._addBusyToRandomCpu(part);
        });
    }


    _addIdleToRandomCpu(millis) {
        let cpu = this._cpus[ this._rand(0, os.cpus().length-1) ];
        cpu.times.idle += millis;
    }


    _addBusyToRandomCpu(millis) {
        let t = this._cpus[ this._rand(0, os.cpus().length-1) ].times;

        let left = millis;

        let part = Math.ceil( left / this._rand(1, 5) );
        left -= part;
        t.user += part;

        part = Math.ceil( left / this._rand(1, 5) );
        left -= part;
        t.nice += part;

        part = Math.ceil( left / this._rand(1, 5) );
        left -= part;
        t.sys += part;

        t.irq = left;
    }

    
    _rand(from, to) {
        ok(from<to, `Invalid random args. From:${from} to:${to}`);

        let range = to - from + 1;

        return Math.floor( Math.random() * range ) + from;
    }

    _splitToRandomParts(num) {
        let parts = [];

        while(num) {
            let rand = this._rand(1, 4);
            let part = Math.ceil(num/rand);

            parts.push(part);
            num -= part;
        }

        return parts;
    }


    set(total, busy) {
        this._mock();
        this.zero();

        let idle = total - busy;

        while(idle || busy) {
            let idle_part = Math.ceil(idle/2);
            let busy_part = Math.ceil(busy/2);
            this._addToRandomCpu(idle_part, busy_part);

            busy = Math.max(0, busy - busy_part);
            idle = Math.max(0, idle - idle_part);
        }
    }


    _addToRandomCpu(idle, busy) {        
        let cpu_times = this._cpus[ this._cpu_no ].times;
        let add = 0;


        cpu_times.idle += idle;

        let busy_left = busy;

        add = Math.ceil(busy_left/2);
        cpu_times.user += add;
        busy_left -= add;

        add = Math.ceil(busy_left/2);
        cpu_times.nice += add;
        busy_left -= add;

        add = Math.ceil(busy_left/2);
        cpu_times.sys += add;
        busy_left -= add;

        cpu_times.irq += busy_left;
        

        this._cpu_no = (this._cpu_no + 1) % this._cpus.length;
    }


    reset() {
        os.cpus = this._nativeCpus;
    }

    _mock() {
        os.cpus = this._cpusMock.bind(this);
    }


    _cpusMock() {
        return this._cpus;
    }
}



module.exports.cpu = new MockCpuTimes();