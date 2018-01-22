const {now} = require('./mock-date-now');
const {cputimes:times} = require('./mock-os-cpus');
const {last_instanceof_weak_daemon} = require('./mock-latest-weak-daemon');
const {platform} = require('./mock-platform');
const {latest_log} = require('./mock-latest-log');


global.MOCKS = {
    now,
    times,
    last_instanceof_weak_daemon,
    platform,
    latest_log   
}
