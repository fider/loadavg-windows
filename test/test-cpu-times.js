const {cpu, time, weak_daemon_hunter, latest_log} = MOCKS;

const {CpuTimes} = require('../lib/cpu-times');
const {CpuT} = require('../lib/cput');
const {WeakDaemon} = require('weak-daemon');



describe('Unit test CpuTimes ->', function() {
    const MIN_AGE = 333;
    const SAMPLING = 444;
    let cpu_times = null;


    function getSampleTimes(cpu_times) {
        return cpu_times._cpu_t_samples.map( cpu_t => cpu_t.timestamp );
    }


    beforeEach(function() {
        weak_daemon_hunter.startHunting();
        cpu_times = new CpuTimes({min_sample_age:MIN_AGE, sampling_interval:SAMPLING});

        weak_daemon = weak_daemon_hunter.get();
        weak_daemon_hunter.stopHunting();
    });

    afterEach(function() {
        cpu.reset();
        time.reset();
    });



    it('constructor()', function() {
        expect(weak_daemon.interval).toEqual(SAMPLING);
        expect(weak_daemon.task).toBe(cpu_times.update);
        expect(weak_daemon.isRunning()).toBe(false);

        expect(cpu_times._cpu_t_samples).toEqual([]);
        expect(cpu_times._min_age).toBe(MIN_AGE);

        // Non-mocked WeakDaemon used
        cpu_times = new CpuTimes({min_sample_age:1, sampling_interval:1});
        expect(cpu_times._self_timer instanceof WeakDaemon).toBe(true);
    });



    it('init()', function() {
        spyOn(weak_daemon, 'start').and.callThrough();
        cpu_times.init();

        expect(weak_daemon.isRunning()).toEqual(true);
        expect(weak_daemon.start.calls.count()).toBe(1);
        expect(weak_daemon.start).toHaveBeenCalledWith(true);
    });



    it('update()', function() {
        let cpu_t = new CpuT(0);
        cpu_t.total = 100;
        cpu_t.busy = 10;

        spyOn(CpuT, 'now').and.callFake( () => cpu_t);
        spyOn(cpu_times, '_removeExpiredSamples').and.callThrough();
        spyOn(cpu_times, '_dataConsistencyCheck').and.callThrough();
        spyOn(cpu_times, '_isTotalCpuLoadIncreased').and.callThrough();
        spyOn(cpu_times, '_replaceLastSample').and.callThrough();
        spyOn(cpu_times, '_addSample').and.callThrough();


        // First call
        cpu_times.update();

        expect(cpu_times._dataConsistencyCheck).toHaveBeenCalledTimes(1);
        expect(cpu_times._dataConsistencyCheck.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._removeExpiredSamples).toHaveBeenCalledTimes(1);
        expect(cpu_times._removeExpiredSamples.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._isTotalCpuLoadIncreased).toHaveBeenCalledTimes(1);
        expect(cpu_times._isTotalCpuLoadIncreased.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._addSample).toHaveBeenCalledTimes(1);
        expect(cpu_times._addSample.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._replaceLastSample).toHaveBeenCalledTimes(0);


        // Second call - with new cpu load info updated
        cpu_t = new CpuT(200);
        cpu_t.total = 150;
        cpu_t.busy = 20;
        cpu_times.update();

        expect(cpu_times._dataConsistencyCheck).toHaveBeenCalledTimes(2);
        expect(cpu_times._dataConsistencyCheck.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._removeExpiredSamples).toHaveBeenCalledTimes(2);
        expect(cpu_times._removeExpiredSamples.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._isTotalCpuLoadIncreased).toHaveBeenCalledTimes(2);
        expect(cpu_times._isTotalCpuLoadIncreased.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._addSample).toHaveBeenCalledTimes(2);
        expect(cpu_times._addSample.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._replaceLastSample).toHaveBeenCalledTimes(0);


        // Third call - without cpu load info updated
        cpu_t = new CpuT(300);
        cpu_t.total = 150;
        cpu_t.busy = 20;
        cpu_times.update();

        expect(cpu_times._dataConsistencyCheck).toHaveBeenCalledTimes(3);
        expect(cpu_times._dataConsistencyCheck.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._removeExpiredSamples).toHaveBeenCalledTimes(3);
        expect(cpu_times._removeExpiredSamples.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._isTotalCpuLoadIncreased).toHaveBeenCalledTimes(3);
        expect(cpu_times._isTotalCpuLoadIncreased.calls.mostRecent().args[0]).toBe(cpu_t);

        expect(cpu_times._addSample).toHaveBeenCalledTimes(2);

        expect(cpu_times._replaceLastSample).toHaveBeenCalledTimes(1);
        expect(cpu_times._replaceLastSample.calls.mostRecent().args[0]).toBe(cpu_t);

    });



    it('_addSample()', function() {
        expect(getSampleTimes(cpu_times)).toEqual([]);

        cpu_times._addSample( new CpuT(1) );
        expect(getSampleTimes(cpu_times)).toEqual([1]);

        cpu_times._addSample( new CpuT(4) );
        expect(getSampleTimes(cpu_times)).toEqual([4,1]);

        cpu_times._addSample( new CpuT(3)  );
        cpu_times._addSample( new CpuT(20) );
        expect(getSampleTimes(cpu_times)).toEqual([20, 3, 4, 1]);
    });



    it('_replaceLastSample()', function() {
        expect(getSampleTimes(cpu_times)).toEqual([]);

        cpu_times._addSample( new CpuT(2) );
        cpu_times._addSample( new CpuT(4) );
        cpu_times._addSample( new CpuT(6) );
        expect(getSampleTimes(cpu_times)).toEqual([6, 4, 2]);

        cpu_times._replaceLastSample( new CpuT(7)  );
        expect(getSampleTimes(cpu_times)).toEqual([7, 4, 2]);

        cpu_times._addSample( new CpuT(8) );
        expect(getSampleTimes(cpu_times)).toEqual([8, 7, 4, 2]);

        cpu_times._replaceLastSample( new CpuT(1)  );
        expect(getSampleTimes(cpu_times)).toEqual([1, 7, 4, 2]);
    });



    it('_isTotalCpuLoadIncreased()', function() {
        expect(getSampleTimes(cpu_times)).toEqual([]);

        let cpu_t = new CpuT(2);
        cpu_t.total = 10;
        cpu_times._addSample( cpu_t );

        cpu_t = new CpuT(4);
        cpu_t.total = 20;
        cpu_times._addSample( cpu_t );

        cpu_t = new CpuT(6);
        cpu_t.total = 18;
        expect(cpu_times._isTotalCpuLoadIncreased(cpu_t)).toBe(false);

        cpu_t.total = 20;
        expect(cpu_times._isTotalCpuLoadIncreased(cpu_t)).toBe(false);

        cpu_t.total = 22;
        expect(cpu_times._isTotalCpuLoadIncreased(cpu_t)).toBe(true);
    });



    it('_removeExpiredSamples', function() {

        cpu_times = new CpuTimes({
            min_sample_age: 10,
            sampling_interval: 1
        });

        let samples = [10, 11, 12, 13, 20, 30, 40, 50];
        samples.forEach( sample => cpu_times._addSample( new CpuT( sample ) ) );
        samples.reverse();

        // Nothing removed
        cpu_times._removeExpiredSamples( new CpuT(15) );
        cpu_times._removeExpiredSamples( new CpuT(19) );
        expect(getSampleTimes(cpu_times)).toEqual(samples);

        cpu_times._removeExpiredSamples( new CpuT(20) );
        expect(getSampleTimes(cpu_times)).toEqual(samples);

        cpu_times._removeExpiredSamples( new CpuT(21) );
        samples.pop(); // 11, ...
        expect(getSampleTimes(cpu_times)).toEqual(samples);

        cpu_times._removeExpiredSamples( new CpuT(22) );
        samples.pop(); // 12, ...
        expect(getSampleTimes(cpu_times)).toEqual(samples);

        cpu_times._removeExpiredSamples( new CpuT(25) );
        samples.pop(); // 13, ...
        expect(getSampleTimes(cpu_times)).toEqual(samples);

        cpu_times._removeExpiredSamples( new CpuT(29) );
        expect(getSampleTimes(cpu_times)).toEqual(samples);

        cpu_times._removeExpiredSamples( new CpuT(30) );
        samples.pop(); // 20, ...
        expect(getSampleTimes(cpu_times)).toEqual(samples);

        cpu_times._removeExpiredSamples( new CpuT(100) );
        samples.pop(); // 30, ...
        samples.pop(); // 40, ...
        samples.pop(); // 50
        expect(getSampleTimes(cpu_times)).toEqual(samples);
    });



    it('_findOlderOrEqualNeighbour()', function() {
        const cput_7 = new CpuT(7);
        const cput_12 = new CpuT(12);
        const cput_18 = new CpuT(18);

        expect(cpu_times._findOlderOrEqualNeighbour( 10 )).toBe( undefined );

        cpu_times._addSample(cput_7);
        cpu_times._addSample(cput_12);
        cpu_times._addSample(cput_18);


        expect(cpu_times._findOlderOrEqualNeighbour( 5 )).toBe( undefined );

        expect(cpu_times._findOlderOrEqualNeighbour(  7 )).toBe( cput_7 );
        expect(cpu_times._findOlderOrEqualNeighbour( 10 )).toBe( cput_7 );

        expect(cpu_times._findOlderOrEqualNeighbour( 12 )).toBe( cput_12 );
        expect(cpu_times._findOlderOrEqualNeighbour( 15 )).toBe( cput_12 );

        expect(cpu_times._findOlderOrEqualNeighbour( 18 )).toBe( cput_18 );
        expect(cpu_times._findOlderOrEqualNeighbour( 25 )).toBe( cput_18 );
    });



    it('_findYoungerNeighbour()', function() {
        const cput_7 = new CpuT(7);
        const cput_12 = new CpuT(12);
        const cput_18 = new CpuT(18);

        expect(cpu_times._findYoungerNeighbour( 10 )).toBe( undefined );

        cpu_times._addSample(cput_7);
        cpu_times._addSample(cput_12);
        cpu_times._addSample(cput_18);


        expect(cpu_times._findYoungerNeighbour( 5 )).toBe( cput_7 );

        expect(cpu_times._findYoungerNeighbour(  7 )).toBe( cput_12 );
        expect(cpu_times._findYoungerNeighbour( 10 )).toBe( cput_12 );

        expect(cpu_times._findYoungerNeighbour( 12 )).toBe( cput_18 );
        expect(cpu_times._findYoungerNeighbour( 15 )).toBe( cput_18 );

        expect(cpu_times._findYoungerNeighbour( 18 )).toBe( undefined );
        expect(cpu_times._findYoungerNeighbour( 25 )).toBe( undefined );
    });



    it('cputAt()', function() {

        function cputToRaw(cput) {
            return {
                timestamp: cput.timestamp,
                busy: cput.busy,
                total: cput.total
            };
        }

        const input = [
            {timestamp:10, busy:110, total:  200},
            {timestamp:20, busy:210, total: 1000}
        ];

        const current_cput = {
             timestamp:30, busy:310, total: 1100
        };

        input.forEach( ({timestamp, busy, total}) => {
            let cpu_t = new CpuT(timestamp);
            cpu_t.busy = busy;
            cpu_t.total = total;
            cpu_times._addSample( cpu_t );
        });


        const cput_at_9  = cpu_times.cputAt(9, current_cput);
        const cput_at_10 = cpu_times.cputAt(10, current_cput);
        const cput_at_11 = cpu_times.cputAt(11, current_cput);
        const cput_at_15 = cpu_times.cputAt(15, current_cput);
        const cput_at_18 = cpu_times.cputAt(18, current_cput);
        const cput_at_20 = cpu_times.cputAt(20, current_cput);
        const cput_at_22 = cpu_times.cputAt(22, current_cput);
        const cput_at_30 = cpu_times.cputAt(30, current_cput);

        expect( cput_at_9 ).toBe(null);
        expect( cputToRaw(cput_at_10) ).toEqual({timestamp:10, busy:110, total:200});  // -> Predefined sample
        expect( cputToRaw(cput_at_11) ).toEqual({timestamp:11, busy:120, total:280});  // estimated
        expect( cputToRaw(cput_at_15) ).toEqual({timestamp:15, busy:160, total:600});  // estimated
        expect( cputToRaw(cput_at_18) ).toEqual({timestamp:18, busy:190, total:840});  // estimated
        expect( cputToRaw(cput_at_20) ).toEqual({timestamp:20, busy:210, total:1000}); // -> Predefined sample
        expect( cputToRaw(cput_at_22) ).toEqual({timestamp:22, busy:230, total:1020}); // estimated
        expect( cputToRaw(cput_at_30) ).toEqual({timestamp:30, busy:310, total:1100}); // -> Predefined sample
    });



    it('_dataConsistencyCheck()', function() {
        latest_log.mock();

        let cpu_t = new CpuT(10);
        cpu_t.total = 100;
        cpu_t.busy = 20;

        cpu_times._dataConsistencyCheck(cpu_t);
        expect(latest_log.get()).toBe('');
        latest_log.clean();


        cpu_times._addSample(cpu_t);


        // Invalid timestamp test
        cpu_t = new CpuT(9);
        cpu_t.total = 200;
        cpu_t.busy = 50;
        cpu_times._dataConsistencyCheck(cpu_t);
        expect(latest_log.get().substring(0,7)).toBe('Warning');
        latest_log.clean();


        cpu_t.timestamp = 10;
        cpu_times._dataConsistencyCheck(cpu_t);
        expect(latest_log.get().substring(0,7)).toBe('Warning');
        latest_log.clean();


        cpu_t.timestamp = 11;
        cpu_times._dataConsistencyCheck(cpu_t);
        expect(latest_log.get()).toBe('');
        latest_log.clean();


        // Invalid total load test
        cpu_t = new CpuT(11);
        cpu_t.total = 99;
        cpu_times._dataConsistencyCheck(cpu_t);
        expect(latest_log.get().substring(0,7)).toBe('Warning');
        latest_log.clean();

        cpu_t.total = 100;
        cpu_times._dataConsistencyCheck(cpu_t);
        expect(latest_log.get()).toBe('');
        latest_log.clean();

        cpu_t.total = 101;
        cpu_times._dataConsistencyCheck(cpu_t);
        expect(latest_log.get()).toBe('');
        latest_log.clean();


        latest_log.reset();
    });

});


