const {ok} = require('assert');


class MockMethod {
    constructor() {
        this._origin_obj = null;
        this._origin_func_name = null;
        this._origin_func = null;
    }
    

    mock(target_obj, func_name, mock_caller, mock_func) {
        ok( typeof target_obj === 'object' || typeof target_obj === 'function' );
        ok( typeof func_name === 'string' );
        ok( typeof target_obj[func_name] === 'function' );
        ok( typeof mock_caller === 'object' || typeof mock_caller === 'null');
        ok( typeof mock_func === 'function' );


        this._origin_obj = target_obj;
        this._origin_func_name = func_name;
        this._origin_func = target_obj[func_name];
        target_obj[func_name] = mock_func.bind(mock_caller);
    }

    reset() {
        this._origin_obj[ this._origin_func_name ] = this._origin_func;
        
        this._origin_obj = null;
        this._origin_func_name = null;
        this._origin_func = null;
    }
}



module.exports.MockMethod = MockMethod;
