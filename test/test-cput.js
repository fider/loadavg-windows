const {CpuT} = require('../lib/cput');

const {time, cpu} = MOCKS;


const os = require('os');
const {inspect:i} = require('util');


describe('Unit test CpuT ->', function() {

    afterEach(function() {
        time.reset();
        cpu.reset();
    });



    it('constructor()', function() {

        let cpu_t = new CpuT(777);
        expect( cpu_t.timestamp ).toBe( 777 );
        expect( cpu_t.total ).toBe( 0 );
        expect( cpu_t.busy ).toBe( 0 );
    });



    it('now()', function() {
        time.ms(888);
        cpu.busy(1234).idle(4321);
        let cpu_t = CpuT.now();
        
        time.reset();
        expect( cpu_t.timestamp ).toBe(888);
        expect( cpu_t.total ).toBe(5555);
        expect( cpu_t.busy ).toBe(1234);


        time.ms(4455);
        cpu.busy(3333).idle(4444);        
        cpu_t = CpuT.now();
        
        time.reset();
        expect( cpu_t.timestamp ).toBe( 4455 );
        expect( cpu_t.total ).toEqual(7777);
        expect( cpu_t.busy ).toEqual(3333);

    });
    


    it('_validateArguments()', function() {
        expect( ()=>{ new CpuT(5.5) } ).toThrowError(TypeError);
        expect( ()=>{ new CpuT(0) }   ).toThrowError(TypeError);
        expect( ()=>{ new CpuT(5)}    ).not.toThrow();
    });
});

