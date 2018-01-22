const {now, times, last_instanceof_weak_daemon} = MOCKS;

const {CpuTimes} = require('../lib/cpu-times');
const {CpuT} = require('../lib/cput');



describe('CpuTimes', function() {

    beforeAll(function() {
        now.mock();
        times.mock();
        last_instanceof_weak_daemon.mock();
    });


    afterAll(function() {
        now.reset();
        times.reset();
        last_instanceof_weak_daemon.reset();
    });


    
    const invalid_args = [
        {min_sample_age: 0   ,sampling_interval: 1  },
        {min_sample_age: 1   ,sampling_interval: 0  },
        {min_sample_age: 1.5 ,sampling_interval: 1  },
        {min_sample_age: 1   ,sampling_interval: 1.5},
        {/*undefined*/        sampling_interval: 1  },
        {  min_sample_age: 1  /*undefined*/         },
        /* undefined */
    ];
    for(const arg of invalid_args) {
        it(`constructor should not accept invalid argument: "${arg}"`, function() {
            expect( ()=>{ new CpuTimes(arg) } ).toThrowError(TypeError);
        });
    }



    it(`should not throw error`, function() {
        now.set(200);
        times.set(100, 20);
        let cpu_times = new CpuTimes({min_sample_age:1, sampling_interval:1});
    });



    describe('(instance)', function() {

        let cpu_times = null;
        let current_cpu_t = null;


        beforeAll(function() {    

            cpu_times = new CpuTimes({min_sample_age:51, sampling_interval:10});
            cpu_times.init();


            // Prepare data
            const input__timestamp_total_busy = [
                [2,  10,   5],
                [8,  20,  15],
                [10, 100, 20],
                [20, 200, 40],
                [30, 300, 60],
                [40, 400, 80],
                [50, 500, 100],
                [60, 700, 130]
            ];
            for(const [timestamp, total, busy] of input__timestamp_total_busy) {
                now.set(timestamp);
                times.set(total, busy);
                last_instanceof_weak_daemon.trigger();
            }

            // Sample with timestamp=2 should be dropped so we are unable to do cputAt(7);

            now.set(70);
            times.set(900, 140);
            current_cpu_t = CpuT.now();
        });


    
        afterAll(function() {
        });


        
        const expected__timestamp_total_busy = [
            [ 9, 60,  17.5  ],
            [10, 100, 20    ],
            [15, 150, 30    ],
            [52, 540, 106   ],
            [67, 840, 137   ]
        ];
        for(const [timestamp, total, busy] of expected__timestamp_total_busy) {
            it(`cputAt() should be able to estimate sample at: ${timestamp}`, function() {
                let cpu_t = cpu_times.cputAt(timestamp, current_cpu_t);
                expect(cpu_t.timestamp).toBe(timestamp);
                expect(cpu_t.total).toBe(total);
                expect(cpu_t.busy).toBe(busy);
            })
        }
        
       
        
        it(`cputAt() should NOT be able to estimate sample at: 7 (sample with timestamp 2 should be dropped)`, function() {
            let cpu_t = cpu_times.cputAt(7, current_cpu_t);
            expect(cpu_t).toBe(null);
        });
    
    });    

});