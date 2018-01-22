const {MockMethod} = require('./mock-method');
const os = require('os');



class MockCpuTimes extends MockMethod {
    constructor() {
        super();

        // Members
        this._cpus = [];

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
        this._current_cpu = 0;
    }

    mock() {
        super.mock(os, 'cpus', this, this.cpus);
        this.zero();
    }

    cpus() {
        return this._cpus;
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


    set(total, busy) {
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
        let times = this._cpus[ this._current_cpu ].times;
        let add = 0;


        times.idle += idle;

        let busy_left = busy;

        add = Math.ceil(busy_left/2);
        times.user += add;
        busy_left -= add;

        add = Math.ceil(busy_left/2);
        times.nice += add;
        busy_left -= add;

        add = Math.ceil(busy_left/2);
        times.sys += add;
        busy_left -= add;

        times.irq += busy_left;
        

        this._current_cpu = (this._current_cpu + 1) % this._cpus.length;
    }
}



module.exports.cputimes = new MockCpuTimes();