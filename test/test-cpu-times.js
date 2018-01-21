const {CpuTimes} = require('../lib/cpu-times');

const {now, cputimes:times} = mocks;


describe('CpuTimes', function() {
    beforeAll(function() {
        now.init();
        times.init();
    });

    afterAll(function() {
        now.reset();
        times.reset();
    });

    
});