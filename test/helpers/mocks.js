const os = require('os');
const {ok} = require('assert');


class MethodMock {
    constructor() {
        this._origin_obj = null;
        this._origin_func_name = null;
        this._origin_func = null;
    }
    

    init(target_obj, func_name, mock_caller, mock_func) {
        ok( typeof target_obj === 'object' || typeof target_obj === 'function' );
        ok( typeof func_name === 'string' );
        ok( typeof target_obj[func_name] === 'function' );
        ok( typeof mock_caller === 'object' || typeof mock_caller === 'null');
        ok( typeof mock_func === 'function' );


        if( this._origin_obj || this._origin_func || this._origin_func_name ) {
            throw new Error(`function '${this._origin_func.name}' already mocked as '${this._origin_func_name}'`);
        }

        this._origin_obj = target_obj;
        this._origin_func_name = func_name;
        this._origin_func = target_obj[func_name];
        target_obj[func_name] = mock_func.bind(mock_caller);
    }


    reset() {
        this._origin_obj[ this._origin_func_name ] = this._origin_func;
        
        this._origin_obj = null;
        this._origin_func_name = null;
        this._origin_func = null;
    }
}



class CpuTimesMock extends MethodMock {
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

    init() {
        super.init(os, 'cpus', this, this.cpus);
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
        while(total && busy) {
            let total_part = Math.ceil(total/2);
            let busy_part = Math.ceil(busy/2);
            this._addToRandomCpu(total_part, busy_part);

            busy -= busy_part;
            total -= total_part;
        }
    }


    _addToRandomCpu(total, busy) {
        let times = this._cpus[ this._current_cpu ].times;


        times.idle = total - busy;

        let busy_left = busy;
        times.user = Math.ceil(busy_left/2);
        busy_left -= times.user;

        times.nice = Math.ceil(busy_left/2);
        busy_left -= times.nice;

        times.sys = Math.ceil(busy_left/2);
        busy_left -= times.sys;

        times.irq = busy_left;
        

        this._current_cpu = (this._current_cpu + 1) % this._cpus.length;
    }
    
}



class DateNowMock extends MethodMock {
    constructor() {
        super();

        this._now = 0;
    }

    init() {
        super.init(Date, 'now', this, this.now);
    }
    
    now() {
        return this._now;
    }

    set(timestamp) {
        this._now = timestamp;
    }
}



global.mocks = {
    now: new DateNowMock(),
    cputimes: new CpuTimesMock()
};
