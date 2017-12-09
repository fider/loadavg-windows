const assert = require('assert');
const process = require('process');
const os = require('os');
const fs = require('fs');
const WeakDaemon = require('weak-daemon').WeakDaemon



/**
 * Consts for test purposes
 */
const TEST__LOADAVG_PERIOD_0 = 1000;
const TEST__LOADAVG_PERIOD_1 = 2000;
const TEST__LOADAVG_PERIOD_2 = 3000;
const TEST__MIN_SAMPLE_AGE    = Math.max(TEST__LOADAVG_PERIOD_0, TEST__LOADAVG_PERIOD_1, TEST__LOADAVG_PERIOD_2);
const TEST__SAMPLING_INTERVAL = Math.min(TEST__LOADAVG_PERIOD_0, TEST__LOADAVG_PERIOD_1, TEST__LOADAVG_PERIOD_2);
const TIME_MARGIN = TEST__SAMPLING_INTERVAL/2;



// Simulate proper NODE_ENV to not run loadavg-windows immediately in case of win32 OS
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
process.env.NODE_ENV = 'test';
const {CpuT, CpuTimes, LoadavgWindows} = require('../index');
process.env.NODE_ENV = ORIGINAL_NODE_ENV;


/******************************************************************************
 *                              Info log
 */
console.log('loadavg-windows test started. It can take a while...');

var progress = new WeakDaemon(
    2000,
    process.stdout.write,
    process.stdout,
    ['.']);
progress.start(true);

var progressMonitor = new WeakDaemon(
    TEST__SAMPLING_INTERVAL*18,
    ()=>{
        console.error('This task is taking too long !  Most probably error in tests (or such high cpu load during tests)');
        process.exit();
    },
    null);


    
function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function sleepS(sec) {
    return _sleep(1000*sec);
}
function sleepMs(ms) {
    return _sleep(ms);
}


function _busyWait(ms) {
    let end = Date.now() + ms;
    while(Date.now() < end) {/* busy wait */};
}
function busyWaitS(sec) {
    _busyWait(1000*sec);
}
function busyWaitMs(ms) {
    _busyWait(ms);
}



class Stopwatch {
    constructor() {
        this._start_t = 0;
    }
    
    start() {
        this._start_t = Date.now();
    }
    
    get time() {
        return Date.now() - this._start_t;
    }
}



function isMaxOneSamplesOlderThan(cpu_times, time_limit) {
    let samples = cpu_times.filter(  cpu_t => 
        cpu_t.timestamp <= time_limit
    ) || [];
    
    return samples.length <= 1;
}



function areSamplesSorted(cput_samples) {
    let prev_time = 0;
    
    // Loop backward
    for( let i=cput_samples.length - 1;  i>=0;  i-- ) {
        let curr_time = cput_samples[i].timestamp;
        
        if(curr_time <= prev_time) {
            return false;
        }
        
        prev_time = curr_time;
    }
    
    return true;
}



function haveSamplesNonDescValues(cput_samples) {
    let prev_busy = 0;
    let prev_total = 0;
    
    // Loop backward
    for(let i=cput_samples.length - 1; i>=0; i--) {
        let busy = cput_samples[i].busy;
        let total = cput_samples[i].total;
        
        if( busy < prev_busy  ||  total < prev_total ) {
            return false;
        }
        
        prev_busy = busy;
        prev_total = total;
    }
    
    return true;
}


// Enables non-blocking await sleep
test().then(

    ()=>{
        console.log(`\n[loadavg-windows] Tested OK`);
    },
    
    (reason)=>{
        console.log('\n', reason);
        process.exit();
    }
);

const util = require('util');
function inspect(obj) {
    return util.inspect(obj, {depth:null});
}

// `main` test function
async function test() {
    

    
    /******************************************************************************
     *                              Internal components test
     */     
    /*****************************************
     *         CpuT class test
     */
    var cpu_t = new CpuT(123);

    // [TC]  Default values
    assert( cpu_t.timestamp === 123 );
    assert( cpu_t.total     === 0   );
    assert( cpu_t.busy      === 0   );

    
    // [TC]  Invalid constructor args
    assert.doesNotThrow( ()=>{ new CpuT(1) }, Error );
    assert.throws( ()=>{ new CpuT(0)  }, TypeError );
    assert.throws( ()=>{ new CpuT(-1) }, TypeError );
    assert.throws( ()=>{ new CpuT({}) }, TypeError );
    
    
    // [TC]  now() return values
    cpu_t = CpuT.now();    
    assert( Number.isInteger(cpu_t.timestamp)  &&  cpu_t.timestamp > 0, `CpuT.timestamp expected to be integer number > 0. Actual:${cpu_t.timestamp}`);
    assert( Number.isInteger(cpu_t.busy)       &&  cpu_t.busy > 0,      `CpuT.busy expected to be integer number > 0. Actual:${cpu_t.busy}`);
    assert( Number.isInteger(cpu_t.total)      &&  cpu_t.total > 0,     `CpuT.total expected to be integer number > 0. Actual:${cpu_t.total}`);

    
    // [TC]  now() proper timestamp generation
    var timestamp_before = Date.now();
    cpu_t = CpuT.now();
    var timestamp_after = Date.now();
    assert( timestamp_before <= cpu_t.timestamp  &&  cpu_t.timestamp <= timestamp_after,  `Timestamp generation seems to be invalid.  timestamp_before:${timestamp_before}  cpu_t.timestamp:${cpu_t.timestamp}  timestamp_after:${timestamp_after}` );
       
       
    // [TC]  Assuming that processor were in idle state since system start
    assert( cpu_t.total > cpu_t.busy,  `Timestamp generation seems to be invalid  (or such cpu load during test)` );

    
    // [TC]  Multiple `now()` call and results comparison
    cpu_t = CpuT.now();
    
    // Generate cpu times
    busyWaitS(1);
    
    // Give system time to update cpu times
    await sleepS(2);
    
    var new_cpu_t = CpuT.now();
    assert(cpu_t.timestamp < new_cpu_t.timestamp, `Error`);
    assert(cpu_t.total     < new_cpu_t.total    , `Error`);
    assert(cpu_t.busy      < new_cpu_t.busy     , `Error`);
    

    
    /*****************************************
     *         CpuTimes class test
     */
    // [TC]  Valid arguments value (value 1)
    assert.doesNotThrow( ()=>{ new CpuTimes({min_sample_age: 1 ,sampling_interval: 1}) }, TypeError, `Valid arguments throws unexpected error`);
    
    // [TC]  Invalid argument value (value 0)
    assert.throws( ()=>{ new CpuTimes({min_sample_age: 0 ,sampling_interval: 1}) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new CpuTimes({min_sample_age: 1 ,sampling_interval: 0}) }, TypeError, `Invalid arguments not handled properly`);
    
    // [TC]  Invalid argument type (type float)
    assert.throws( ()=>{ new CpuTimes({min_sample_age: 1.5 ,sampling_interval: 1  }) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new CpuTimes({min_sample_age: 1   ,sampling_interval: 1.5}) }, TypeError, `Invalid arguments not handled properly`);
    
    // [TC]  Missing argument (value undefined)
    assert.throws( ()=>{ new CpuTimes({/*min_sample_age*/     sampling_interval: 1 }) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new CpuTimes({  min_sample_age: 1  /*sampling_interval*/  }) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new CpuTimes(                                              ) }, TypeError, `Invalid arguments not handled properly`);
    
    
    // [TC]  Offline test of methods
    var cpu_times = new CpuTimes({ min_sample_age: 1, sampling_interval: 1 });
    
    assert( cpu_times.cputAt(10) === null );
    
    
    var s1 = new CpuT(10); s1.total = 100; s1.busy = 20;
    var s2 = new CpuT(20); s2.total = 200; s2.busy = 40;
    var s3 = new CpuT(30); s3.total = 300; s3.busy = 60;
    var s4 = new CpuT(40); s4.total = 400; s4.busy = 80;
    var s5 = new CpuT(50); s5.total = 500; s5.busy = 100;
    var s6 = new CpuT(60); s6.total = 700; s6.busy = 130;
    var current_cpu_t = new CpuT(70);
    current_cpu_t.total = 900;
    current_cpu_t.busy = 140;
    
    cpu_times._addSample(s1);
    cpu_times._addSample(s2);
    cpu_times._addSample(s3);
    cpu_times._addSample(s4);
    cpu_times._addSample(s5);
    cpu_times._addSample(s6);    
    
    
    var estimated_cpu_t = cpu_times.cputAt(5, current_cpu_t);
    assert( estimated_cpu_t === null );
    
    estimated_cpu_t = cpu_times.cputAt(10, current_cpu_t);
    assert( estimated_cpu_t.timestamp === s1.timestamp && estimated_cpu_t.total === s1.total && estimated_cpu_t.busy === s1.busy );
    
    estimated_cpu_t = cpu_times.cputAt(15, current_cpu_t);
    assert( estimated_cpu_t.timestamp === 15 && estimated_cpu_t.total === 150 && estimated_cpu_t.busy === 30);
    
    estimated_cpu_t = cpu_times.cputAt(52, current_cpu_t);
    assert( estimated_cpu_t.timestamp === 52 && estimated_cpu_t.total === 540 && estimated_cpu_t.busy === 106);
    
    estimated_cpu_t = cpu_times.cputAt(67, current_cpu_t);
    assert( estimated_cpu_t.timestamp === 67 && estimated_cpu_t.total === 840 && estimated_cpu_t.busy === 137);
    
    
    // _findOlderNeighbour test
    assert( cpu_times._findOlderNeighbour(9)  === undefined );
    assert( cpu_times._findOlderNeighbour(10) === s1 );
    assert( cpu_times._findOlderNeighbour(11) === s1 );
    assert( cpu_times._findOlderNeighbour(29) === s2 );
    assert( cpu_times._findOlderNeighbour(30) === s3 );
    assert( cpu_times._findOlderNeighbour(39) === s3 );
    assert( cpu_times._findOlderNeighbour(68) === s6 );
    
    
    // _findYoungerNeighbour test
    assert( cpu_times._findYoungerNeighbour(9)  === s1 );
    assert( cpu_times._findYoungerNeighbour(10) === s2 );
    assert( cpu_times._findYoungerNeighbour(11) === s2 );
    assert( cpu_times._findYoungerNeighbour(29) === s3 );
    assert( cpu_times._findYoungerNeighbour(30) === s4 );
    assert( cpu_times._findYoungerNeighbour(39) === s4 );
    assert( cpu_times._findYoungerNeighbour(68) === undefined );
    
    
    // [TC]  Runtime test of interanl state
    const min_age = 100;
    var cpu_times = new CpuTimes({ min_sample_age: min_age, sampling_interval: 10 });
    
    cpu_times.init();
    var age_limit = Date.now() - min_age;
    
    var stopwatch = new Stopwatch();
    stopwatch.start();
    while( stopwatch.time < 2000 ) {
        
        let cput_samples = cpu_times._cput_samples;
        
        assert( isMaxOneSamplesOlderThan(cput_samples , age_limit), `cput_samples:${inspect(cput_samples)}\n\n age_limit:${age_limit}` );
        assert( areSamplesSorted(cput_samples),                     `cput_samples:${inspect(cput_samples)}`);
        assert( haveSamplesNonDescValues(cput_samples),             `cput_samples:${inspect(cput_samples)}`);
        
        age_limit = Date.now() - min_age;
        await sleepMs(499);
    }
    
    
    
    /*****************************************
     *         LoadavgWindows class test
     */
    // [TC]  Default arguments values (undefined == default)
    assert.doesNotThrow( ()=>{ new LoadavgWindows() }, Error, `Invalid arguments not handled properly`);

    // [TC]  Valid arguments value (value 1)
    assert.doesNotThrow( ()=>{ new LoadavgWindows({time_period_0: 1, time_period_1: 1, time_period_2: 1, min_sample_age: 1, sampling_interval: 1}) }, TypeError, `Invalid arguments not handled properly`); 

    // [TC]  Invalid argument value (value 0)
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 0, time_period_1: 1, time_period_2: 1, min_sample_age: 1, sampling_interval: 1}) }, TypeError);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1, time_period_1: 0, time_period_2: 1, min_sample_age: 1, sampling_interval: 1}) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1, time_period_1: 1, time_period_2: 0, min_sample_age: 1, sampling_interval: 1}) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1, time_period_1: 1, time_period_2: 1, min_sample_age: 0, sampling_interval: 1}) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1, time_period_1: 1, time_period_2: 1, min_sample_age: 1, sampling_interval: 0}) }, TypeError, `Invalid arguments not handled properly`);

    // [TC]  Invalid argument type (type float)
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1.5, time_period_1: 1  , time_period_2: 1  , min_sample_age: 1  , sampling_interval: 1  }) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1  , time_period_1: 1.5, time_period_2: 1  , min_sample_age: 1  , sampling_interval: 1  }) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1  , time_period_1: 1  , time_period_2: 1.5, min_sample_age: 1  , sampling_interval: 1  }) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1  , time_period_1: 1  , time_period_2: 1  , min_sample_age: 1.5, sampling_interval: 1  }) }, TypeError, `Invalid arguments not handled properly`);
    assert.throws( ()=>{ new LoadavgWindows({time_period_0: 1  , time_period_1: 1  , time_period_2: 1  , min_sample_age: 1  , sampling_interval: 1.5}) }, TypeError, `Invalid arguments not handled properly`);

    // [TC]  Missing argument (value undefined)
    assert.throws( ()=>{ new LoadavgWindows({/*time_period_0*/     time_period_1: 1,   time_period_2: 1,   min_sample_age: 1,   sampling_interval: 1 }) }, TypeError, `Invalid arguments not handled properly`); 
    assert.throws( ()=>{ new LoadavgWindows({  time_period_0: 1, /*time_period_1*/     time_period_2: 1,   min_sample_age: 1,   sampling_interval: 1 }) }, TypeError, `Invalid arguments not handled properly`); 
    assert.throws( ()=>{ new LoadavgWindows({  time_period_0: 1,   time_period_1: 1, /*time_period_2*/     min_sample_age: 1,   sampling_interval: 1 }) }, TypeError, `Invalid arguments not handled properly`); 
    assert.throws( ()=>{ new LoadavgWindows({  time_period_0: 1,   time_period_1: 1,   time_period_2: 1, /*min_sample_age*/     sampling_interval: 1 }) }, TypeError, `Invalid arguments not handled properly`); 
    assert.throws( ()=>{ new LoadavgWindows({  time_period_0: 1,   time_period_1: 1,   time_period_2: 1,   min_sample_age: 1, /*sampling_interval*/  }) }, TypeError, `Invalid arguments not handled properly`);

    

    /******************************************************************************
     *                              Runtime test (async part starts here)
     */
     


    /*****************************************
     * Test object
     */
    const CONFIG = {
                     time_period_0     : TEST__LOADAVG_PERIOD_0,
                     time_period_1     : TEST__LOADAVG_PERIOD_1,
                     time_period_2     : TEST__LOADAVG_PERIOD_2,
                     min_sample_age    : TEST__MIN_SAMPLE_AGE,
                     sampling_interval : TEST__SAMPLING_INTERVAL
                    }
                    
    const lw = new LoadavgWindows(CONFIG);
    lw.init();


    /*****************************************
     * Test helpers
     */
    const start = Date.now();


    
    function inspectAll() {
        return inspect(lw, {depth:null});
    }



    function timeElapsed() {
        return Date.now() - start;
    }

    

    function isResultAsExpected(result, is_first_expected, is_second_expected, is_third_expected) {
        
        for(let value of result) {
            if( ! (typeof value === 'number' &&  (! Number.isNaN(value))) ) {
                return false;
            }
        }
        
        if( ! (
            ((is_first_expected)   ?  (result[0] !== 0)  :  (result[0] === 0)) &&
            ((is_second_expected)  ?  (result[1] !== 0)  :  (result[1] === 0)) &&
            ((is_third_expected)   ?  (result[2] !== 0)  :  (result[2] === 0))
            ) ) {
                
            return false;
        }
        
        return true;
    }



    var prev_samples_count = 0;

    function isNumOfSamplesIncreased() {
        let samples_count = lw._cpu_times._cput_samples.length;
        
        assert(samples_count >= prev_samples_count, `Samples count should incerese.  Curr:${samples_count}, prev:${prev_samples_count}`);
        
        prev_samples_count = samples_count;
    }

    function isNumOfSamplesTheSame() {
        let samples_count = lw._cpu_times._cput_samples.length;
        
        assert(samples_count === prev_samples_count, `Samples count should be the same.  Curr:${samples_count}, prev:${prev_samples_count}`);
        
        prev_samples_count = samples_count;
    }


    function busyTask() {
        for(let i=0; i<1000; i++) {
            if(i%1000 === 1000) {
                console.log(` `);
            }
        }
    }


    var busy = new WeakDaemon(1, busyTask, null);
    busy.start();



    /*****************************************
     * Test steps
     */
    // [TC]  Small runtime test
    


    stopwatch = new Stopwatch();
    stopwatch.start();
    time_limit = 0;
    
    // Before 1 min
    while( stopwatch.time < TEST__LOADAVG_PERIOD_0 ) {
        let load_avg = lw.loadavg();
        let samples  = lw._cpu_times._cput_samples;
        
        assert( isMaxOneSamplesOlderThan(samples, time_limit),     `cput_samples:${inspect(samples)} \n time_limit:${time_limit}`);
        assert( haveSamplesNonDescValues(samples),                 `cput_samples:${inspect(samples)}`);
        assert( areSamplesSorted(samples),                         `cput_samples:${inspect(samples)}`);
        assert( isResultAsExpected(load_avg, false, false, false), `load_avg:${inspect(load_avg)}`);
        
        time_limit = Date.now() - TEST__MIN_SAMPLE_AGE;
        busyWaitMs(100);
        await sleepMs(9);
    }
    
    await sleepMs(2*TEST__SAMPLING_INTERVAL);
    
    // Before 5 min
    while( stopwatch.time < TEST__LOADAVG_PERIOD_1) {
        let load_avg = lw.loadavg();
        let samples  = lw._cpu_times._cput_samples;
        
        assert( isMaxOneSamplesOlderThan(samples, time_limit),     `cput_samples:${inspect(samples)} \n time_limit:${time_limit}`);
        assert( haveSamplesNonDescValues(samples),                 `cput_samples:${inspect(samples)}`);
        assert( areSamplesSorted(samples),                         `cput_samples:${inspect(samples)}`);
        assert( isResultAsExpected(load_avg, true, false, false),  `load_avg:${inspect(load_avg)} \n ${inspect(lw)}`);
        
        time_limit = Date.now() - TEST__MIN_SAMPLE_AGE;
        busyWaitMs(100);
        await sleepMs(49);
    }
    
    await sleepMs(2*TEST__SAMPLING_INTERVAL);

    // Before 15 min
    while( stopwatch.time < TEST__LOADAVG_PERIOD_2) {
        let load_avg = lw.loadavg();
        let samples  = lw._cpu_times._cput_samples;
        
        assert( isMaxOneSamplesOlderThan(samples, time_limit),     `cput_samples:${inspect(samples)} \n time_limit:${time_limit}`);
        assert( haveSamplesNonDescValues(samples),                 `cput_samples:${inspect(samples)}`);
        assert( areSamplesSorted(samples),                         `cput_samples:${inspect(samples)}`);
        assert( isResultAsExpected(load_avg, true, true, false),   `load_avg:${inspect(load_avg)}`);
        
        time_limit = Date.now() - TEST__MIN_SAMPLE_AGE;
        busyWaitMs(100);
        await sleepMs(49);
    }
    
    await sleepMs(2*TEST__SAMPLING_INTERVAL);
    
    // After 15 min
    while( stopwatch.time < 3*TEST__LOADAVG_PERIOD_2) {
        let load_avg = lw.loadavg();
        let samples  = lw._cpu_times._cput_samples;
        
        assert( isMaxOneSamplesOlderThan(samples, time_limit),     `cput_samples:${inspect(samples)} \n time_limit:${time_limit}`);
        assert( haveSamplesNonDescValues(samples),                 `cput_samples:${inspect(samples)}`);
        assert( areSamplesSorted(samples),                         `cput_samples:${inspect(samples)}`);
        assert( isResultAsExpected(load_avg, true, true, true),    `load_avg:${inspect(load_avg)} \n loadavg_windows:${inspect(lw)}`);
        
        time_limit = Date.now() - TEST__MIN_SAMPLE_AGE;
        busyWaitMs(100);
        await sleepMs(49);
    }

    
}