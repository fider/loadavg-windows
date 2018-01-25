const {LoadavgWindows} = require('../lib/loadavg-windows');
const {CpuTimes} = require('../lib/cpu-times');


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



    it('constructor()', function() {       

        expect(loadavg_windows._loadavg_period_1).toBe(22);
        expect(loadavg_windows._loadavg_period_2).toBe(33);
        expect(loadavg_windows._loadavg_period_3).toBe(44);
      
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
        const estimated_cpu_t = new CpuT(0);
        spyOn(cpu_times, 'cputAt').and.callFake(function() {
            return estimated_cpu_t;
        });

        const current_cpu_t = new CpuT(0);

        current_cpu_t.timestamp(100);
        current_cpu_t.total = 200;
        current_cpu_t.busy = 30
        let load = loadavg_windows._loadavg(current_cpu_t, 100);


        // check if cputAt have been called with proper arguments !

        // corner case?
        load = loadavg_windows._loadavg(current_cpu_t, );

        // 0 case
        load = loadavg_windows._loadavg(current_cpu_t, );

        // exact case
        load = loadavg_windows._loadavg(current_cpu_t, );

        
        load = loadavg_windows._loadavg(current_cpu_t, );
    });



    it('loadavg()', function() {

    });


    


    


});

