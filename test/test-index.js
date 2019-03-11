const os = require('os');
const nativeLoadavg = os.loadavg;
const ok = require('assert');
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




describe('loadavg-windows platform support test.', function() {


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
        it(`Should not be running on "${not_supported}" platform`, function() {
            platform.set(not_supported);

            require('../lib/index');
            expect(os.loadavg).toBe(nativeLoadavg);
        });
    }


    for(const supported of supported_platforms) {
        it(`Should be running on "${supported}" platform`, function() {
            platform.set(supported);

            process.env.NODE_ENV = 'development';
            require('../lib/index');
            expect(os.loadavg).not.toBe(nativeLoadavg);
        });
    }
});



describe('LoadavgWindows module test', function() {

    let weak_daemon = null;
    let loadavg_win = null;

    // (!) os.loadavg is CPU_DATA[i].load multiplied by number of logical cores
    const CPU_DATA = [
        {minutes: 100,  busy:  100,  total:  1000,  load: [0.25, 0, 0] },
        {minutes: 101,  busy:  200,  total:  2000,  load: [0.1, 0, 0] },
        {minutes: 102,  busy:  800,  total:  3000,  load: [0.6, 0, 0] },
        {minutes: 103,  busy: 1200,  total:  4000,  load: [0.4, 0, 0] },
        {minutes: 104,  busy: 1300,  total:  5000,  load: [0.1, 0, 0] },

        {minutes: 105,  busy: 2200,  total:  6000,  load: [0.9, 0.42, 0] },
        {minutes: 106,  busy: 3200,  total:  7000,  load: [1,   0.6,  0] },
        {minutes: 107,  busy: 3400,  total:  8000,  load: [0.2, 0.52, 0] },
        {minutes: 108,  busy: 4200,  total:  9000,  load: [0.8, 0.6,  0] },
        {minutes: 109,  busy: 4800,  total: 10000,  load: [0.6, 0.7,  0] },

        {minutes: 110,  busy: 5300,  total: 11000,  load: [0.5, 0.62, 0] },
        {minutes: 111,  busy: 5700,  total: 12000,  load: [0.4, 0.5,  0] },
        {minutes: 112,  busy: 6000,  total: 13000,  load: [0.3, 0.52, 0] },
        {minutes: 113,  busy: 6200,  total: 14000,  load: [0.2, 0.4,  0] },
        {minutes: 114,  busy: 7200,  total: 15000,  load: [1,   0.48, 0] },

        {minutes: 115,  busy: 8100,  total: 16000,  load: [0.9, 0.56, 0.5325] },
        {minutes: 116,  busy: 8400,  total: 17000,  load: [0.3, 0.54, 0.547] }
    ];

    // os.loadavg result depends on number of logical cores.
    // Below is required, so test may be performed on any machine
    CPU_DATA.forEach( sample => {
        sample.load = sample.load.map( load => parseInt(100 * load * CPUS_LEN)/100 );
    });


    let prev_sample_num = 0;

    function loadSample(sample_num) {
        if( (prev_sample_num+1 != sample_num)  ||  (sample_num >= CPU_DATA.length) ) {
            throw new Error(`'Test code' error - incorrect data loaded.
                prev_sample_num:${prev_sample_num}
                n:${sample_num}
            `);
        }

        const {minutes, busy, total} = CPU_DATA[sample_num];
        time.min(minutes);
        cpu.busy(busy).total(total);
        weak_daemon.tick();

        prev_sample_num = sample_num;
    }


    function computeLoad(busy, total) {
        ok(busy <= total, `Invalid input. BUSY=${busy} should be <= TOTAL=${total}`);
        return parseInt( 100 * CPUS_LEN * (busy/total) ) / 100;
    }



    beforeAll(function() {
        jasmine.addMatchers(global.custom_matchers);

        delete require.cache[require.resolve('../lib/index')];

        platform.mock();
        // latest_log.mock();
        weak_daemon_hunter.startHunting();

        let {minutes, busy, total} = CPU_DATA[0];
        time.min(minutes);
        cpu.busy(busy).total(total);

        platform.set('win32');

        loadavg_win = require('../lib/index').loadavg_windows;

        weak_daemon = weak_daemon_hunter.get();

        time.reset();
        cpu.reset();
        platform.reset();
        // latest_log.reset();
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
        // Same test should be done while testing class LoadavgWindows
        const ONE_MINUTE = 60000;

        expect(loadavg_win._loadavg_period_0).toBe(ONE_MINUTE);
        expect(loadavg_win._loadavg_period_1).toBe(ONE_MINUTE * 5);
        expect(loadavg_win._loadavg_period_2).toBe(ONE_MINUTE * 15);

        expect(loadavg_win._sampling_interval).toBe(ONE_MINUTE);
        expect(loadavg_win._min_sample_age).toBe(ONE_MINUTE * 15);
    });


    it('runtime simulation before 1 min runtime', function() {

        function verify(reslativeBusy, relativeTotal, relativeTimeS) {

            if (relativeTimeS >= 60) {
                throw new Error(`Invalid test code. Expected relativeTimeS < 60. Actual=${relativeTimeS}`);
            }

            time.min( CPU_DATA[0].minutes ).sec(relativeTimeS);

            let busy  = CPU_DATA[0].busy  + reslativeBusy;
            let total = CPU_DATA[0].total + relativeTotal;
            cpu.busy( busy ).total( total );
            let expected = [reslativeBusy/relativeTotal, 0, 0].map( load => parseInt(100 * load * CPUS_LEN)/100 );

            let result = os.loadavg();

            expect(result).toEqual(expected);
        }

        expected = verify(1, 4, 10);
        expected = verify(1, 4, 40);
        expected = verify(5, 5, 15);
        expected = verify(5, 10, 15);

        // This test case checks only calculations (load will be greater than possible because of input data used)
        expected = verify(6, 5, 15);
    });


    it('runtime simulation', function() {


        loadSample(1);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[1].load);

        loadSample(2);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[2].load);



        time.min(CPU_DATA[2].minutes).sec(15);
        cpu.busy(900).total(3150);
        let result_0 = computeLoad(550, 900);
        result = os.loadavg();
        expect(result).toEqual([result_0, 0, 0]);



        loadSample(3);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[3].load);

        loadSample(4);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[4].load);



        loadSample(5);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[5].load);

        loadSample(6);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[6].load);



        loadSample(7);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[7].load);

        loadSample(8);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[8].load);



        loadSample(9);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[9].load);

        loadSample(10);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[10].load);



        time.min(CPU_DATA[10].minutes).sec(48);
        cpu.busy(5310).total(11160);
        result_0 = computeLoad(110, 360);
        let result_1 = computeLoad(2310, 4360);
        result = os.loadavg();
        expect(result).toEqual([result_0, result_1, 0]);



        loadSample(11);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[11].load);

        loadSample(12);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[12].load);



        loadSample(13);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[13].load);

        loadSample(14);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[14].load);



        loadSample(15);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[15].load);

        loadSample(16);
        result = os.loadavg();
        expect(result).toEqual(CPU_DATA[16].load);



        time.min(CPU_DATA[16].minutes).sec(36);
        cpu.busy(8520).total(17920);
        result_0 = computeLoad(240, 1320);
        result_1 = computeLoad(2640, 5320);
        let result_2 = computeLoad(7960, 15320);
        result = os.loadavg();
        expect(result).toEqual([result_0, result_1, result_2]);
    });

});
