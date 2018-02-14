const {inspect: insp} = require('util');


function getPrecision(number) {
    let floating_part = number.toString().split('.')[1];
    let precision = (floating_part ? floating_part.length : 0);
    return precision;
}


const custom_matchers = {

    toBeInRange(util, customEqualityTesters) {

        return {
            compare(actual, expected, tolerance) {
                /* Note that: `1.95 - 1.94  !=  0.01`   so need to work on integers */
                const FACTOR = Math.pow(10, getPrecision(tolerance));
                const TOLERANCE = parseInt(tolerance * FACTOR);
                let result = {
                    pass: false,
                    message: `Unsupported types of arguments.
                        
                        ACTUAL, EXPECTED, TOLERANCE should be:
                        - number, number, number
                        or
                        - array of numbers, array of numbers, number

                        ACTUAL, EXPECTED, TOLERANCE are:
                        ACTUAL:${insp(actual)}
                        EXPECTED:${insp(expected)}
                        TOLERANCE:${insp(tolerance)}

                    `
                }
                

                if(
                    typeof(actual)    == 'number'  &&
                    typeof(expected)  == 'number'  &&
                    typeof(tolerance) == 'number' 
                ) {
                    
                    const ACTUAL    = parseInt(actual   * FACTOR); 
                    const EXPEXCTED = parseInt(expected * FACTOR);

                    result.pass = (Math.abs(ACTUAL - EXPECTED) <= TOLERANCE);
                    result.message = `Expected ${actual} to be ${expected} +- ${tolerance}`;



                } else if(
                    Array.isArray(actual)   &&
                    Array.isArray(expected) &&
                    typeof(tolerance) == 'number'
                ) {

                    let ok = (actual.length == expected.length);
                    for(const [index, exp_value] of expected.entries()) {
                        const ACTUAL   = parseInt(actual[index]   * FACTOR); 
                        const EXPECTED = parseInt(expected[index] * FACTOR);                        
                        
                        ok = ok && (Math.abs(ACTUAL - EXPECTED) <= TOLERANCE);                        
                    }

                    if( ok ) { 
                        result.pass = true;
                        result.message = '';
                    } else {
                        result.pass = false;
                        result.message = `Expected:
                            ${insp(actual)}
                            to be:
                            ${insp(expected)}
                            +-${tolerance}
                        `;
                    }
                }
                

                return result;
            }
        }
    }
}

global.custom_matchers = custom_matchers;
