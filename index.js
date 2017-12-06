const os = require('os');
const process = require('process');

const CpuT = require('./src/CpuT').CpuT;
const CpuTimes = require('./src/CpuTimes').CpuTimes;
const LoadavgWindows = require('LoadavgWindows').LoadavgWindows;



if(process.env.NODE_ENV === 'production') {
    // TODO replace _validateArguments with empty function
}



if (os.platform() === 'win32'  &&  process.env.NODE_ENV !== 'test') {
    console.log('[loadavg-windows] Using platform-independent loadavg implementation.');
    
    const loadavg_windows = new LoadavgWindows();
    const loadavg = loadavg_windows.loadavg.bind(loadavg_windows);
    loadavg_windows.init();
    
    os.loadavg = loadavg;
    exports.loadavg = loadavg;
}



// Exposed for test purposes
exports.CpuT = CpuT;
exports.CpuTimes = CpuTimes;
exports.LoadavgWindows = LoadavgWindows;
