const os = require('os');
const process = require('process');
const weak_daemon_provider = require('weak-daemon');
const CpuT = require('./cput').CpuT;



/********************************************************************
 * Stores and manages cput samples:
 * - Estimates cput at desired timestamp
 * - Drops oldest sample if redundant
 */
class CpuTimes {
    
    /**
     * @param {object} minimum required sample age
     *                 Expired samples will be removed
     */
    constructor( { min_sample_age, sampling_interval} ) {

                 
        this._validateArguments({
            min_sample_age    : min_sample_age,
            sampling_interval : sampling_interval  
        });

        
        this._cput_samples = [];
        this._min_age = min_sample_age;
        this._self_timer = weak_daemon_provider.getInstance(sampling_interval, this.update, this);
    }
    
    
    
    /**
     * Start collecting data
     * Without this CpuTimes is useless
     */
    init() {
        this._self_timer.start(true);
    }
    
    
    
    /**
     * Add new sample and remove expired ones
     */
    update() {
        let current_cpu_t = CpuT.now();
        
        this._validateNewSample(current_cpu_t)

        this._removeExpiredSamples(current_cpu_t);

        this._addSample(current_cpu_t);
    }



    /**
     * This function estimates cput at specific timestamp.
     * Why estimate ranther than direct use of existing samples?
     *  - to save time and memory sampling frequency is very low,
     *    so using closest sample will cause too big deviation
     *
     * @param {number}  Timestamp of cput
     * @param {CpuT}    Helper, current CpuT instance
     */
    cputAt(estimation_timestamp, current_cput) {
                
        let older = this._findOlderNeighbour(estimation_timestamp);
        let younger = this._findYoungerNeighbour(estimation_timestamp);


        
        /* Oldest sample is too young:
         *  - unable estimate load at desired time
         *
         *     ESTIMATED   Oldest      Youngest   Current
         *      SAMPLE     sample       sample    sample
         *   -----|----------|-----...----|---------|------>
         *
         */
        if ( ! older) {            
            return null;
        }


        /* If youngest sample is older than estimating sample
         * then treat current sample as youngest and use it to estimation
         *
         *      Oldest       Youngest   ESTIMATED   Current
         *      sample        sample     SAMPLE     sample
         *   -----|-----...-----|----------|----------|------>
         *
         */
        if ( ! younger) {
            younger       = new CpuT(current_cput.timestamp);
            younger.total = current_cput.total;
            younger.busy  = current_cput.busy;
        }


        /* Can I use existing samples to estimate sample at specific time?
         *
         *
         *      Oldest       ESTIMATED     Youngest   Current
         *      sample        SAMPLE        sample    sample
         *   -----|-----...-----|------...----|---------|------>
         *
         */
        let weight = (estimation_timestamp - older.timestamp) / (younger.timestamp - older.timestamp);
         

        let estimated_part_total = weight * (younger.total - older.total);
        let estimated_part_busy  = weight * (younger.busy  - older.busy);


        let estimated_cput   = new CpuT(estimation_timestamp);
        estimated_cput.total = older.total + estimated_part_total;
        estimated_cput.busy  = older.busy + estimated_part_busy;
        
        
        return estimated_cput;

    }

    
    
    _validateArguments({ min_sample_age, sampling_interval}) {
        if( ! (
            Number.isInteger(min_sample_age)     &&  min_sample_age    > 0  &&
            Number.isInteger(sampling_interval)  &&  sampling_interval > 0) ) {
            
            throw new TypeError(`Invalid arguments.
                Expected object with properties:
                    min_sample_age     : integer > 0
                    sampling_interval : integer > 0
                Actual:
                    min_sample_age    : ${min_sample_age}
                    sampling_interval : ${sampling_interval}`);
        }
    }
    

    
    /**
     * Finds cput sample that is  `(younger) AND (closest)`  to specific timestamp
     *
     * Reverse logic here:
     * IF timestamp bigger THEN sample is younger
     *
     *         Older                Younger  
     *       neighbour  timestamp  neighbour
     *      -----|----------|----------|------->
     *   t_min                                t_max
     *
     *
     * @param {number} (timestamp)
     *
     * @returns {number|undefined}  undefined if such sample not exists
     */
    _findYoungerNeighbour(timestamp) {
        
        // younger than given timestamp
        let younger = this._cput_samples.filter( cpu_t =>
            cpu_t.timestamp > timestamp
        );
        
        // find min => find oldest
        return younger.reduce( (prev, curr) =>
            (prev.timestamp <= curr.timestamp)  ?  prev  :  curr
        , younger[0]);
                    
    }
    
    
    
    /**
     * Finds cput sample that is  `(older OR equal) AND (closest)`  to specific timestamp
     *
     * For purpose of future cput estimations
     * it is important to treat neighbour as older
     * also if it's timestamp is exatly the same as we are looking for
     *
     * Reverse logic here:
     * IF timestamp smaller THEN sample is older
     *
     *         Older                Younger  
     *       neighbour  timestamp  neighbour
     *      -----|----------|----------|------->
     *   t_min                                t_max
     *
     *
     * @param {number} (timestamp)
     *
     * @returns {number|undefined}  undefined if such sample not exists
     */
    _findOlderNeighbour(timestamp) {
        
        // equal or older than given timestamp
        let older = this._cput_samples.filter( cpu_t =>
            cpu_t.timestamp <= timestamp
        );
        
        // find max => find youngest
        return older.reduce( (prev, curr) =>
             (prev.timestamp >= curr.timestamp)  ?  prev  :  curr
        , older[0]);
    }
    
    
    
    /**
     * Checks if specific sample is older than latest sample
     *
     * @param {CpuT} expecting latest cput as input
     */
    _validateNewSample(new_cpu_t) {
        
        let latest_cpu_t = this._cput_samples[0] || new CpuT( new_cpu_t.timestamp - 1 );
        
        if( new_cpu_t.timestamp <= latest_cpu_t.timestamp ) {
            
            console.error(                
                `LoadavgWindows internal module error - fix it on your own or ask author for help
                
                Module:    loadavg-windows
                Class:     CpuTimes
                Function:  _validateNewSample
                Details:   Expecting younger sample than previous one.
                           
                           New:      ${new_cpu_t.timestamp}
                           Previous: ${latest_cpu_t.timestamp}
            `);
        }
    }



    /**
     * Removes redundant samples - only one oldest than this._min_age should stay
     * @private
     * @param {CpuT} Current CpuT
     */
    _removeExpiredSamples(current_cpu_t) {
        let current_timestamp = current_cpu_t.timestamp;
        
        if(parseInt(current_timestamp) !== current_timestamp) {
            throw new Error(`Internal module error. Current timestamp: ${current_timestamp}`);
        }
        
        if(this._cput_samples.length < 2) {
            return;
        }
        
        let oldest_required_sample = this._findOlderNeighbour(current_timestamp - this._min_age);
        
        if( oldest_required_sample ) {            
            this._cput_samples = this._cput_samples.filter( cpu_t =>
                cpu_t.timestamp >= oldest_required_sample.timestamp
            );
        }
    }
    
    
    _addSample(current_cpu_t) {
        this._cput_samples.unshift(current_cpu_t);
    }
}



exports.CpuTimes = CpuTimes;
