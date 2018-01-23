const os = require('os');
const process = require('process');

const {CpuT} = require('./cput');
const {CpuTimes} = require('./cpu-times');
const {LoadavgWindows} = require('./loadavg-windows');



if(process.env.NODE_ENV === 'production') {
    // TODO replace _validateArguments with empty function
}


var loadavg = null;
var loadavg_windows = null;


if (os.platform() === 'win32') {
    console.log('[loadavg-windows] Using platform-independent loadavg implementation.');
    
    loadavg_windows = new LoadavgWindows();
    loadavg = loadavg_windows.loadavg.bind(loadavg_windows);
    loadavg_windows.init();
    
    os.loadavg = loadavg;
}


exports.loadavg_windows = loadavg_windows;
