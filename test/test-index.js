const os = require('os');
const nativeLoadavg = os.loadavg;
const {inspect:insp} = require('util');
const CPUS_LEN = os.cpus().length;

const {
    cpu,
    time,
    weak_daemon_hunter,
    platform,
    latest_log
    } = MOCKS;



const supported_platforms = [
    'win32'
];

const not_supported_platforms = [
    'aix',
    'darwin',
    'freebsd',
    'linux',
    'openbsd',
    'sunos',
    ''
];




describe('loadavg-windows platform support test', function() {


    beforeAll(function() {
        platform.mock();
    });

    afterAll(function() {
        platform.reset();
        os.loadavg = nativeLoadavg;
    });


    beforeEach(function() {
        delete require.cache[require.resolve('../lib/index')];
        os.loadavg = nativeLoadavg;
    });



    for(const not_supported of not_supported_platforms) {
        it(`should not be running on "${not_supported}" platform`, function() {
            platform.set(not_supported);

            require('../lib/index');
            expect(os.loadavg).toBe(nativeLoadavg);
        });
    }


    for(const supported of supported_platforms) {
        it(`should be running on "${supported}" platform`, function() {
            platform.set(supported);            
            latest_log.mock();
            
            require('../lib/index');
            expect(latest_log.get()).toBe('[loadavg-windows] Using platform-independent loadavg implementation.');

            latest_log.reset();
            latest_log.clean();

            expect(os.loadavg).not.toBe(nativeLoadavg);
        });
    }    
});






describe('LoadavgWindows', function() {

    let weak_daemon = null;
    let loadavg_win = null;


    /**
     *   '// 0.3'  - is total cpus load basing on surrounding samples
     */
    const SAMPLES = [
        {minutes:  100,  busy:  100,  total:  1000}, // loaded in first step
        // 0.1
        {minutes: 101,  busy:  200,  total:  2000}, 
        // 0.6
        {minutes: 102,  busy:  800,  total:  3000},
        // 0.4
        {minutes: 103,  busy: 1200,  total:  4000},
        // 0.1
        {minutes: 104,  busy: 1300,  total:  5000},
        // 0.9
        {minutes: 105,  busy: 2200,  total:  6000},
        // 1
        {minutes: 106,  busy: 3200,  total:  7000},
        // 0.2
        {minutes: 107,  busy: 3400,  total:  8000},
        // 0.8
        {minutes: 108,  busy: 4200,  total:  9000},
        // 0.6
        {minutes: 109,  busy: 4800,  total: 10000},
        // 0.5
        {minutes: 110,  busy: 5300,  total: 11000},
        // 0.4
        {minutes: 111,  busy: 5700,  total: 12000},
        // 0.3
        {minutes: 112,  busy: 6000,  total: 13000},
        // 0.2
        {minutes: 113,  busy: 6200,  total: 14000},
        // 1
        {minutes: 114,  busy: 7200,  total: 15000},
        // 0.9
        {minutes: 115,  busy: 8100,  total: 16000},
        // 0.3
        {minutes: 116,  busy: 8400,  total: 17000}
    ];

    
    let prev_sample_num = 0;

    function loadSample(sample_num) {
        if( (prev_sample_num+1 != sample_num)  ||  (sample_num >= SAMPLES.length) ) {
            throw new Error(`'Test code' error - incorrect data loaded.
                prev_sample_num:${prev_sample_num}
                n:${sample_num}
            `);
        }

        const {minutes, busy, total} = SAMPLES[sample_num];
        time.min(minutes);
        cpu.busy(busy).total(total);
        weak_daemon.tick();
        
        prev_sample_num = sample_num;
    }


    function loadAt(period) {
        if(period < 1 || period >= SAMPLES.length) {
            throw new Error(`'Test code' error. 'period'=${period} out of bounds`);
        }

        let prev = period - 1;
        let curr = period;

        const {total: prev_total, busy: prev_busy } = SAMPLES[prev];
        const {total: curr_total, busy: curr_busy } = SAMPLES[curr];

        
    }



    beforeAll(function() {
        jasmine.addMatchers(global.custom_matchers);

        delete require.cache[require.resolve('../lib/index')];

        platform.mock();
        latest_log.mock();        
        weak_daemon_hunter.startHunting();

        let {minutes, busy, total} = SAMPLES[0];
        time.min(minutes);
        cpu.busy(busy).total(total);

        platform.set('win32');

        loadavg_win = require('../lib/index').loadavg_windows;

        weak_daemon = weak_daemon_hunter.get();


        time.reset();
        cpu.reset();
        platform.reset();
        latest_log.reset();
        weak_daemon_hunter.stopHunting();
    });


    afterAll(function() {
        time.reset();
        cpu.reset();
    });


    beforeEach(function() {
    });


    afterEach(function() {
    });


    it('initialization test', function() {
        // Alerady initilized with {100min, 0s total:1000, busy:200}
        
        // Same test should be done while testing class LoadavgWindows
        const ONE_MINUTE = 60000;
        
        expect(loadavg_win._loadavg_period_0).toBe(ONE_MINUTE);        
        expect(loadavg_win._loadavg_period_1).toBe(ONE_MINUTE * 5);
        expect(loadavg_win._loadavg_period_2).toBe(ONE_MINUTE * 15);

        expect(loadavg_win._sampling_interval).toBe(ONE_MINUTE);
        expect(loadavg_win._min_sample_age).toBe(ONE_MINUTE * 15);      
    });



    it('test before first sample', function() {
        time.min( SAMPLES[0].minutes ).sec(59);
        let result = os.loadavg();

        expect(result).toEqual([0,0,0]);
    });



    it('test with samples loading', function() {

        loadSample(1);
        result = os.loadavg();
        expect(result).toEqual([  0.1*CPUS_LEN  ,0,0]);

        loadSample(2);
        result = os.loadavg();
        expect(result).toEqual([ 0.6*CPUS_LEN, 0, 0]);



        loadSample(3);
        result = os.loadavg();
        expect(result).toEqual([  0.4*CPUS_LEN, 0,0]);

        loadSample(4);
        result = os.loadavg();
        expect(result).toEqual([  0.1*CPUS_LEN  ,0,0]);



        loadSample(5);
        result = os.loadavg();
        expect(result).toEqual([  0.9*CPUS_LEN, 0.42*CPUS_LEN, 0]);

        loadSample(6);
        result = os.loadavg();
        expect(result).toEqual([  1*CPUS_LEN, 0.6*CPUS_LEN, 0]);



        loadSample(7);
        result = os.loadavg();
        expect(result).toEqual([  0.2*CPUS_LEN,0.52*CPUS_LEN, 0]);

        loadSample(8);
        result = os.loadavg();
        expect(result).toEqual([  0.8*CPUS_LEN  ,0.6*CPUS_LEN,0]);



        loadSample(9);
        result = os.loadavg();
        expect(result).toEqual([  0.6*CPUS_LEN  ,0.7*CPUS_LEN,0]);

        loadSample(10);
        result = os.loadavg();
        expect(result).toEqual([  0.5*CPUS_LEN  ,0.62*CPUS_LEN,0]);



        loadSample(11);
        result = os.loadavg();
        expect(result).toEqual([  0.4*CPUS_LEN  ,0.5*CPUS_LEN,0]);

        loadSample(12);
        result = os.loadavg();
        expect(result).toEqual([  0.3*CPUS_LEN  ,0.52*CPUS_LEN,0]);



        loadSample(13);
        result = os.loadavg();
        expect(result).toEqual([  0.2*CPUS_LEN  ,0.4*CPUS_LEN,0]);

        loadSample(14);
        result = os.loadavg();
        expect(result).toEqual([  1*CPUS_LEN  ,0.48*CPUS_LEN,0]);



        loadSample(15);
        result = os.loadavg();
        expect(result).toEqual([  0.9*CPUS_LEN  ,0.56*CPUS_LEN, 0.5325*CPUS_LEN]);
        
        loadSample(16);
        result = os.loadavg();
        expect(result).toEqual([  0.3*CPUS_LEN  ,0.54*CPUS_LEN, 0.545*CPUS_LEN]);
        // 75% of 3-rd period + load between 4-th period and current
    });

});
