const {CpuT} = require('../lib/cput');

const {now, times} = MOCKS;



describe('CpuT', function() {

    beforeAll(function() {
        now.mock();
        times.mock();
    });

    afterAll(function() {
        now.reset();
        times.reset();
    });


    it('created with "new" should return proper timestamp with zero load', function() {
        let cpu_t = new CpuT(123);
        expect(cpu_t.timestamp).toBe(123);
        expect(cpu_t.total).toBe(0);
        expect(cpu_t.busy).toBe(0);
    });


    let invalid_args = [ , 0, -1, 2.5, {}];
    for(const arg of invalid_args) {
        it(`constructor should not accept invalid argument: '${arg}'`, function() {
            expect( ()=>{ new CpuT(arg) } ).toThrowError(TypeError);
        });
    }
    

    it(`"now" should return proper timestamp and load`, function() {
        now.set(321);
        times.set(124, 99);

        let cpu_t = CpuT.now();

        expect(cpu_t.timestamp).toBe(321);
        expect(cpu_t.total).toBe(124);
        expect(cpu_t.busy).toBe(99);
        

        now.set(21);
        times.set(130, 1);
        
        cpu_t = CpuT.now();

        expect(cpu_t.timestamp).toBe(21);
        expect(cpu_t.total).toBe(130);
        expect(cpu_t.busy).toBe(1);
    });
});

