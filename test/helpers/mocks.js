const {cpu} = require('./mock-os-cpus');
const {time} = require('./mock-date-now');
const {weak_daemon_hunter} = require('./weak-daemon-hunter');
const {platform} = require('./mock-platform');
const {latest_log} = require('./mock-latest-log');


global.MOCKS = {
    cpu,
    time,
    weak_daemon_hunter,
    platform,
    latest_log   
}