// const {CpuT} = require('../lib/cput');

// const {time, cpu} = MOCKS;



// describe('CpuT', function() {

//     beforeAll(function() {
//     });

//     afterAll(function() {
//         time.reset();
//         cpu.reset();
//     });


//     it('created with "new" should return proper timestamp with zero load', function() {
//         let cpu_t = new CpuT(123);
//         expect(cpu_t.timestamp).toBe(123);
//         expect(cpu_t.total).toBe(0);
//         expect(cpu_t.busy).toBe(0);
//     });


//     let invalid_args = [ , 0, -1, 2.5, {}];
//     for(const arg of invalid_args) {
//         it(`constructor should not accept invalid argument: '${arg}'`, function() {
//             expect( ()=>{ new CpuT(arg) } ).toThrowError(TypeError);
//         });
//     }
    

//     it(`"now" should return proper timestamp and load`, function() {
//         time.ms(321);
//         cpu.idle(25).busy(99);

//         let cpu_t = CpuT.now();

//         expect(cpu_t.timestamp).toBe(321);
//         expect(cpu_t.total).toBe(124);
//         expect(cpu_t.busy).toBe(99);
        

//         time.ms(21);
//         cpu.idle(129).busy(1);
        
//         cpu_t = CpuT.now();

//         expect(cpu_t.timestamp).toBe(21);
//         expect(cpu_t.total).toBe(130);
//         expect(cpu_t.busy).toBe(1);
//     });
// });

