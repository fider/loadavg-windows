const os = require('os');
const nativeLoadavg = os.loadavg;
const {platform, latest_log} = MOCKS;


describe('loadavg-windows', function() {
    
    beforeAll(function() {
        platform.mock();   
    });

    afterAll(function() {
        platform.reset();
        os.loadavg = nativeLoadavg;
    });


    beforeEach(function() {
        delete require.cache[require.resolve('../index')];
        os.loadavg = nativeLoadavg;
    })


    it('should not be running on linux platform', function() {
        platform.set('linux')
        require('../index');
        expect(os.loadavg).toBe(nativeLoadavg);
    });

    it('should be running on win32 platform', function() {
        platform.set('win32')
        
        latest_log.mock();
        require('../index');
        expect(latest_log.get()).toBe('[loadavg-windows] Using platform-independent loadavg implementation.');
        latest_log.reset();
        latest_log.clean();

        expect(os.loadavg).not.toBe(nativeLoadavg);
    });
});




