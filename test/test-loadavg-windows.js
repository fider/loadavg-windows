const {LoadavgWindows} = require('../lib/loadavg-windows');
const {CpuTimes} = require('../lib/cpu-times');
const {CpuT} = require('../lib/cput');

const os = require('os');

const {
    now,
    times,
    weak_daemon_hunter,
    platform,
    latest_log 
    } = MOCKS;



describe('Unit test LoadavgWindows ->', function() {
    
    let loadavg_windows = null;
    let cpu_times = null;
    let weak_daemon = null;


    beforeEach(function() {
        weak_daemon_hunter.startHunting();

        loadavg_windows = new LoadavgWindows({
            time_period_0: 22,
            time_period_1: 33,
            time_period_2: 44
        });

        weak_daemon = weak_daemon_hunter.get();
        weak_daemon_hunter.stopHunting();

        cpu_times = loadavg_windows._cpu_times;
    });



    it('_validateArguments()', function() {
        const valid_arg = {
            time_period_0: 22,
            time_period_1: 33,
            time_period_2: 44
        };
        const invalid_arg_0 = {
            time_period_0: 0,
            time_period_1: 33,
            time_period_2: 44
        };
        const invalid_arg_1 = {
            time_period_0: 22,
            time_period_1: 0,
            time_period_2: 44
        };
        const invalid_arg_2 = {
            time_period_0: 22,
            time_period_1: 33,
            time_period_2: 0
        };

        expect(()=>{ new LoadavgWindows( valid_arg )     }).not.toThrow();
        expect(()=>{ new LoadavgWindows( invalid_arg_0 ) }).toThrowError(TypeError);
        expect(()=>{ new LoadavgWindows( invalid_arg_1 ) }).toThrowError(TypeError);
        expect(()=>{ new LoadavgWindows( invalid_arg_2 ) }).toThrowError(TypeError);
    });


    it('default constructor()', function() {
        const loadavg_windows_default = new LoadavgWindows;
        const ONE_MINUTE = 60000;
        
        expect(loadavg_windows_default._loadavg_period_0).toBe(ONE_MINUTE);        
        expect(loadavg_windows_default._loadavg_period_1).toBe(ONE_MINUTE * 5);
        expect(loadavg_windows_default._loadavg_period_2).toBe(ONE_MINUTE * 15);

        expect(loadavg_windows_default._sampling_interval).toBe(ONE_MINUTE);
        expect(loadavg_windows_default._min_sample_age).toBe(ONE_MINUTE * 15);
    });


    it('constructor()', function() {       

        expect(loadavg_windows._loadavg_period_0).toBe(22);
        expect(loadavg_windows._loadavg_period_1).toBe(33);
        expect(loadavg_windows._loadavg_period_2).toBe(44);
      
        expect(cpu_times instanceof CpuTimes).toBe(true);
        expect(cpu_times._min_age).toBe(44);

        const self_timer = cpu_times._self_timer;
        expect(self_timer).toBe(weak_daemon);
        expect(self_timer.interval).toBe(22);


        // expect errors
        const invalid_arg_0 = {
            time_period_0: 0,
            time_period_1: 33,
            time_period_2: 44
        };
        const invalid_arg_1 = {
            time_period_0: 22,
            time_period_1: 0,
            time_period_2: 44
        };
        const invalid_arg_2 = {
            time_period_0: 22,
            time_period_1: 33,
            time_period_2: 0
        };
        expect(()=>{ new LoadavgWindows( invalid_arg_0 ) }).toThrowError(TypeError);
        expect(()=>{ new LoadavgWindows( invalid_arg_1 ) }).toThrowError(TypeError);
        expect(()=>{ new LoadavgWindows( invalid_arg_2 ) }).toThrowError(TypeError);
    });



    it('init()', function() {
        spyOn(cpu_times, 'init');

        loadavg_windows.init();
        expect(cpu_times.init).toHaveBeenCalledTimes(1);
    });


    
    it('_loadavg()', function() {
        const current_cpu_t = new CpuT(1);
        const estimated_cpu_t = new CpuT(1);
        spyOn(cpu_times, 'cputAt').and.callFake(function() {
            return estimated_cpu_t;
        });


        // 0% load case
        let time_ago = 90;

        current_cpu_t.timestamp =100;
        current_cpu_t.total = 200;
        current_cpu_t.busy = 30
        
        estimated_cpu_t.timestamp = current_cpu_t.timestamp - time_ago;
        estimated_cpu_t.total = 300;
        estimated_cpu_t.busy = 30;

        let load = loadavg_windows._loadavg(current_cpu_t, time_ago);
        expect(cpu_times.cputAt.calls.mostRecent().args[0]).toBe(current_cpu_t.timestamp - time_ago, current_cpu_t);
        expect(cpu_times.cputAt.calls.mostRecent().args[1]).toBe(current_cpu_t);
        expect(load).toBe(0);


        // 25% load case
        time_ago = 25;

        current_cpu_t.timestamp = 100;
        current_cpu_t.total = 238;
        current_cpu_t.busy = 37;
        
        estimated_cpu_t.timestamp = current_cpu_t.timestamp - time_ago;
        estimated_cpu_t.total = 210;
        estimated_cpu_t.busy = 30;

        load = loadavg_windows._loadavg(current_cpu_t, time_ago);
        expect(cpu_times.cputAt.calls.mostRecent().args[0]).toBe(current_cpu_t.timestamp - time_ago, current_cpu_t);
        expect(cpu_times.cputAt.calls.mostRecent().args[1]).toBe(current_cpu_t);
        expect(load).toBe(0.25 * os.cpus().length);


        // 50% load case
        time_ago = 38;

        current_cpu_t.timestamp = 123;
        current_cpu_t.total = 320;
        current_cpu_t.busy = 190;
        
        estimated_cpu_t.timestamp = current_cpu_t.timestamp - time_ago;
        estimated_cpu_t.total = 320-32;
        estimated_cpu_t.busy = 190-16;

        load = loadavg_windows._loadavg(current_cpu_t, time_ago);
        expect(cpu_times.cputAt.calls.mostRecent().args[0]).toBe(current_cpu_t.timestamp - time_ago, current_cpu_t);
        expect(cpu_times.cputAt.calls.mostRecent().args[1]).toBe(current_cpu_t);
        expect(load).toBe(0.5 * os.cpus().length);


        // 76% load case
        time_ago = 38;

        current_cpu_t.timestamp = 500;
        current_cpu_t.total = 500;
        current_cpu_t.busy = 376;
        
        estimated_cpu_t.timestamp = current_cpu_t.timestamp - time_ago;
        estimated_cpu_t.total = 400;
        estimated_cpu_t.busy = 300;

        load = loadavg_windows._loadavg(current_cpu_t, time_ago);
        expect(cpu_times.cputAt.calls.mostRecent().args[0]).toBe(current_cpu_t.timestamp - time_ago, current_cpu_t);
        expect(cpu_times.cputAt.calls.mostRecent().args[1]).toBe(current_cpu_t);
        expect(load).toBe(0.76 * os.cpus().length);


        // 100% load case
        time_ago = 20;
        current_cpu_t.timestamp = 100;
        current_cpu_t.total = 370;
        current_cpu_t.busy = 201;
        
        estimated_cpu_t.timestamp = current_cpu_t.timestamp - time_ago;
        estimated_cpu_t.total = 191;
        estimated_cpu_t.busy = 22;

        load = loadavg_windows._loadavg(current_cpu_t, time_ago);
        expect(cpu_times.cputAt.calls.mostRecent().args[0]).toBe(current_cpu_t.timestamp - time_ago, current_cpu_t);
        expect(cpu_times.cputAt.calls.mostRecent().args[1]).toBe(current_cpu_t);
        expect(load).toBe(1 * os.cpus().length);
    });



    it('loadavg()', function() {
        const current_cpu_t = new CpuT(1);
        spyOn(CpuT, 'now').and.callFake(function() {
            return current_cpu_t;
        });

        let loadavg_index = 0;
        let expected_result = [2, 1.37, 0.2];
        spyOn(loadavg_windows, '_loadavg').and.callFake(function() {
            const result = expected_result[loadavg_index];
            loadavg_index = (loadavg_index + 1) % 3;
            return result;
        });

        let result = loadavg_windows.loadavg();
        expect(result).toEqual(expected_result);

        expect(loadavg_windows._loadavg.calls.count()).toBe(3);

        expect(loadavg_windows._loadavg.calls.argsFor(0)[0]).toBe(current_cpu_t);
        expect(loadavg_windows._loadavg.calls.argsFor(0)[1]).toBe(loadavg_windows._loadavg_period_0);
        
        expect(loadavg_windows._loadavg.calls.argsFor(1)[0]).toBe(current_cpu_t);
        expect(loadavg_windows._loadavg.calls.argsFor(1)[1]).toBe(loadavg_windows._loadavg_period_1);
        
        expect(loadavg_windows._loadavg.calls.argsFor(2)[0]).toBe(current_cpu_t);
        expect(loadavg_windows._loadavg.calls.argsFor(2)[1]).toBe(loadavg_windows._loadavg_period_2);
    });
});

