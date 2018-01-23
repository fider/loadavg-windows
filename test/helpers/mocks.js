const {now} = require('./mock-date-now');
const {cputimes:times} = require('./mock-os-cpus');
const {weak_daemon_hunter} = require('./weak-daemon-hunter');
const {platform} = require('./mock-platform');
const {latest_log} = require('./mock-latest-log');


global.MOCKS = {
    now,
    times,
    weak_daemon_hunter,
    platform,
    latest_log   
}
