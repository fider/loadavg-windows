const os = require('os');
const process = require('process');

const NODE_ENV = process.env.NODE_ENV;

const {CpuT} = require('./cput');
const {CpuTimes} = require('./cpu-times');
const {LoadavgWindows} = require('./loadavg-windows');



if (os.platform() === 'win32') {    
    loadavg_windows = new LoadavgWindows();
    loadavg_windows.init();
    
    os.loadavg = loadavg_windows.loadavg.bind(loadavg_windows);


    if(NODE_ENV == 'development' || NODE_ENV == 'dev') {
        exports.loadavg_windows = loadavg_windows;    
        console.log(`[loadavg-windows] Using platform-independent loadavg implementation.`);
    }
}
