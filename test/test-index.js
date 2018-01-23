const os = require('os');
const nativeLoadavg = os.loadavg;
const {ok} = require('assert');


const {
    now,
    times,
    weak_daemon_hunter,
    platform, latest_log
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


function loadSec(weak_daemon, seconds, total, busy) {
    ok(typeof weak_daemon === 'object');
    ok(typeof seconds === 'number');
    ok(typeof total === 'number');
    ok(typeof busy === 'number');

    now.setSec(seconds);
    times.set(total, busy);
    weak_daemon.trigger();
}

function loadMinSec(weak_daemon, minutes, seconds, total, busy) {
    ok(typeof weak_daemon === 'object');
    ok(typeof minutes === 'number');
    ok(typeof seconds === 'number');
    ok(typeof total === 'number');
    ok(typeof busy === 'number');

    now.setMinSec(minutes, seconds);
    times.set(total, busy);
    weak_daemon.trigger();
}


describe('loadavg-windows', function() {


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
    let loadavg_windows = null;

    beforeAll(function() {
        delete require.cache[require.resolve('../lib/index')];

        now.mock();
        times.mock();
        platform.mock();
        latest_log.mock();        
        weak_daemon_hunter.startHunting();

        
        now.setMinSec(100, 0);
        times.set(1000, 100);

        platform.set('win32');

        loadavg_windows = require('../lib/index').loadavg_windows;

        weak_daemon = weak_daemon_hunter.get();


        now.reset();
        times.reset();
        platform.reset();
        latest_log.reset();
        weak_daemon_hunter.stopHunting();

        // Important !
        loadSec = loadSec.bind(null, weak_daemon);
        loadMinSec = loadMinSec.bind(null, weak_daemon);
    });


    beforeEach(function() {
        now.mock();
        times.mock();
    });


    afterEach(function() {
        now.reset();
        times.reset();
    });


    it('initialization test', function() {
        // Alerady initilized with {100min, 0s total:1000, busy:200}
        expect(os.loadavg()).toEqual([0,0,0]);


        now.setMinSec(100, 55);        
        expect(os.loadavg()).toEqual([0,0,0]);

        times.set(1100, 300);
        now.setMinSec(120, 0);


        console.log(os.loadavg());

console.log(os.loadavg());

        expect(os.loadavg()).toEqual([0,0,0]);

        
    });


    it('test before 1 min', function(){
        // expect(os.loadavg()).toBe
    });


    it('test at 1 min', function(){});


    it('test between 1 and 5 min', function(){});


    it('test at 5 min', function(){});


    it('test between 5 and 15 min', function(){});


    it('test at 15 min', function(){});


    it('test after 15 min', function(){});
});
