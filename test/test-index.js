// const os = require('os');
// const nativeLoadavg = os.loadavg;
// const {ok} = require('assert');



// const {
//     cpu,
//     time,
//     weak_daemon_hunter,
//     platform,
//     latest_log
//     } = MOCKS;



// const supported_platforms = [
//     'win32'
// ];

// const not_supported_platforms = [
//     'aix',
//     'darwin',
//     'freebsd',
//     'linux',
//     'openbsd',
//     'sunos',
//     ''
// ];




// describe('loadavg-windows', function() {


//     beforeAll(function() {
//         platform.mock();   
//     });

//     afterAll(function() {
//         platform.reset();
//         os.loadavg = nativeLoadavg;
//     });


//     beforeEach(function() {
//         delete require.cache[require.resolve('../lib/index')];
//         os.loadavg = nativeLoadavg;
//     });



//     for(const not_supported of not_supported_platforms) {
//         it(`should not be running on "${not_supported}" platform`, function() {
//             platform.set(not_supported);

//             require('../lib/index');
//             expect(os.loadavg).toBe(nativeLoadavg);
//         });
//     }


//     for(const supported of supported_platforms) {
//         it(`should be running on "${supported}" platform`, function() {
//             platform.set(supported);            
//             latest_log.mock();
            
//             require('../lib/index');
//             expect(latest_log.get()).toBe('[loadavg-windows] Using platform-independent loadavg implementation.');

//             latest_log.reset();
//             latest_log.clean();

//             expect(os.loadavg).not.toBe(nativeLoadavg);
//         });
//     }    
// });


    
// describe('LoadavgWindows', function() {

//     let weak_daemon = null;
//     let loadavg_win = null;

//     beforeAll(function() {
//         delete require.cache[require.resolve('../lib/index')];

//         platform.mock();
//         latest_log.mock();        
//         weak_daemon_hunter.startHunting();

        
//         time.min(100);
//         cpu.busy(100).idle(100);

//         platform.set('win32');

//         loadavg_win = require('../lib/index').loadavg_windows;

//         weak_daemon = weak_daemon_hunter.get();


//         time.reset();
//         cpu.reset();
//         platform.reset();
//         latest_log.reset();
//         weak_daemon_hunter.stopHunting();
//     });


//     beforeEach(function() {
//     });


//     afterEach(function() {
//         time.reset();
//         cpu.reset();
//     });


//     it('initialization test', function() {
//         // Alerady initilized with {100min, 0s total:1000, busy:200}
//         expect(os.loadavg()).toEqual([0,0,0]);


//         time.min(100).sec(55);
//         expect(os.loadavg()).toEqual([0,0,0]);

//         cpu.set(1100, 300);
//         time.min(120);


//         console.log(os.loadavg());

// console.log(os.loadavg());

//         expect(os.loadavg()).toEqual([0,0,0]);

        
//     });


//     it('test before 1 min', function(){
//         // expect(os.loadavg()).toBe
//     });


//     it('test at 1 min', function(){});


//     it('test between 1 and 5 min', function(){});


//     it('test at 5 min', function(){});


//     it('test between 5 and 15 min', function(){});


//     it('test at 15 min', function(){});


//     it('test after 15 min', function(){});
// });
