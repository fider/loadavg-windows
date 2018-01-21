const os = require('os');



/********************************************************************
 * Data structure
 * 
 * - timestamp: unix timestamp of taking below measurements
 * - busy:      time in milliseconds that all CPUs were busy since operating system start 
 * - total:     time in milliseconds that all CPUs were on   since operating system start
 */
class CpuT {
    constructor(timestamp) {
        
        this._validateArguments.apply(this, arguments);
        
        this.timestamp = timestamp;
        this.busy = 0;
        this.total = 0;
    }


    /**
     * @returns {CpuT} current cput
     */
    static now() {
        var cpu_t = new CpuT( Date.now() );
        var total = 0;
        var idle = 0;

        os.cpus().forEach( ({times:t}) => {
            total += t.user + t.nice + t.sys + t.idle + t.irq;
            idle += t.idle;
        });

        cpu_t.busy = total - idle;
        cpu_t.total = total;

        return cpu_t;
    }
    
    
    _validateArguments(timestamp, ...rest) {
        
        if( ! (
            rest.length === 0           && 
            Number.isInteger(timestamp) &&
            timestamp > 0
            ) ) {
                
            throw new TypeError(`Invalid arguments.
                Expected arguments:
                    0:    timestamp = integer > 0
                    rest: undefined
                Actual:
                    0:    timestamp = ${timestamp}
                    rest: ${rest.length ? rest : undefined}
            `);
        }
    }
}



exports.CpuT = CpuT;
