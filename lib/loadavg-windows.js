const os = require('os');
const process = require('process');
const CpuTimes = require('./cpu-times').CpuTimes;
const CpuT = require('./cput').CpuT;


const {inspect: i} = require('util');

/********************************************************************
 * Constants used by LoadavgWindows module
 */
const TIME_MS__1_MIN = 60000;
const NUM_OF_CORES = os.cpus().length;

/**
 * Configuration defaults
 */
const DEFAULT__LOADAVG_PERIOD_0 =      TIME_MS__1_MIN;
const DEFAULT__LOADAVG_PERIOD_1 = 5  * TIME_MS__1_MIN;
const DEFAULT__LOADAVG_PERIOD_2 = 15 * TIME_MS__1_MIN;
const DEFAULT__MIN_SAMPLE_AGE    = Math.max(DEFAULT__LOADAVG_PERIOD_0, DEFAULT__LOADAVG_PERIOD_1, DEFAULT__LOADAVG_PERIOD_2);
const DEFAULT__SAMPLING_INTERVAL = Math.min(DEFAULT__LOADAVG_PERIOD_0, DEFAULT__LOADAVG_PERIOD_1, DEFAULT__LOADAVG_PERIOD_2);



/********************************************************************
 * Class that provides loadavg functionality
 */
class LoadavgWindows {

    constructor({time_period_0,
                 time_period_1,
                 time_period_2
                } = {
                 time_period_0     : DEFAULT__LOADAVG_PERIOD_0,
                 time_period_1     : DEFAULT__LOADAVG_PERIOD_1,
                 time_period_2     : DEFAULT__LOADAVG_PERIOD_2
                }) {


        this._validateArguments({
                 time_period_0,
                 time_period_1,
                 time_period_2
                });
                
        
        this._loadavg_period_0 = time_period_0;
        this._loadavg_period_1 = time_period_1;
        this._loadavg_period_2 = time_period_2;

        this._min_sample_age = Math.max(time_period_0, time_period_1, time_period_2);
        this._sampling_interval = Math.min(time_period_0, time_period_1, time_period_2);
        
        // CpuTimes have internal daemon that feeds it with fresh CpuT samples.
        // Samples of CpuT are the only thing required to calculate loadavg.
        this._cpu_times = new CpuTimes( {
            min_sample_age: this._min_sample_age,
            sampling_interval: this._sampling_interval
        });
        
    }

    
    
    init() {
        this._cpu_times.init();
    }
    
    
    
    loadavg() {
        let current_cpu_t = CpuT.now();


        return [
            this._loadavg(current_cpu_t, this._loadavg_period_0), // default 1 min
            this._loadavg(current_cpu_t, this._loadavg_period_1), // default 5 min
            this._loadavg(current_cpu_t, this._loadavg_period_2)  // default 15 min
        ];
    }



    _loadavg(current_cput, period_ms) {
        let target_timestamp = current_cput.timestamp - period_ms;

        let estimated_cput = this._cpu_times.cputAt(target_timestamp, current_cput);

        if( ! estimated_cput ) {
            // Unable to estimate - no samples taken before specific time
            return 0;
        }


        let total = current_cput.total - estimated_cput.total;
        let busy = current_cput.busy - estimated_cput.busy;


        if(total <= 0 || busy < 0) {
            console.warn(`
                Error:
                module: loadavg-windows.               
                It seems that operating system did not updated information about cpus load.
                total:${total}
                busy:${busy}
                period:${period_ms}[ms]
            `);
            
            return -1;
        }

                
        return parseInt( NUM_OF_CORES * (busy/total) * 100 )  /  100;
    }
    
    
    
    _validateArguments( { time_period_0, time_period_1, time_period_2, min_sample_age, sampling_interval } ) {
        if( ! (
            Number.isInteger(time_period_0)     &&  time_period_0     > 0  &&
            Number.isInteger(time_period_1)     &&  time_period_1     > 0  &&
            Number.isInteger(time_period_2)     &&  time_period_2     > 0  ) ) {
            
            throw new TypeError(`Invalid arguments.
                Expected object with properties:
                    time_period_0     : integer > 0
                    time_period_1     : integer > 0
                    time_period_2     : integer > 0
                Actual:
                    time_period_0     : ${time_period_0}
                    time_period_1     : ${time_period_1}
                    time_period_2     : ${time_period_2}`);
        }
    }
}



module.exports.LoadavgWindows = LoadavgWindows;
