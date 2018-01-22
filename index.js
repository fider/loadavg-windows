const os = require('os');
const process = require('process');

const {CpuT} = require('./lib/cput');
const {CpuTimes} = require('./lib/cpu-times');
const {LoadavgWindows} = require('./lib/loadavg-windows');



if(process.env.NODE_ENV === 'production') {
    // TODO replace _validateArguments with empty function
}



if (os.platform() === 'win32') {
    console.log('[loadavg-windows] Using platform-independent loadavg implementation.');
    
    const loadavg_windows = new LoadavgWindows();
    const loadavg = loadavg_windows.loadavg.bind(loadavg_windows);
    loadavg_windows.init();
    
    os.loadavg = loadavg;
    exports.loadavg = loadavg;
} else {
    exports.loadavg = os.loadavg;
}
