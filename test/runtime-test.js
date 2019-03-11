require('../lib/index'); // require('loadavg-windows')

const express = require('express');
const app = express();
const os = require('os');



const data = {
    loadavg1: [],
    loadavg5: [],
    loadavg15: [],
    memoryUsage: {
        heapTotal: [],
        heapUsed: [],
        rss: [],
        external: []
    }
};



app.get('/', getStats )

app.listen(3000, () => console.log(`Call http://localhost:3000 to get stats`))




function updateData() {
    let uptime = parseInt( process.uptime() );

    let memUse = process.memoryUsage();
    data.memoryUsage.heapTotal.push({   x: uptime,  y: parseInt(memUse.heapTotal/1024) });
    data.memoryUsage.heapUsed.push({    x: uptime,  y: parseInt(memUse.heapUsed/1024)  });
    data.memoryUsage.rss.push({         x: uptime,  y: parseInt(memUse.rss/1024)       });
    data.memoryUsage.external.push({    x: uptime,  y: parseInt(memUse.external/1024)  });


    let loadavg = os.loadavg();
    data.loadavg1.push({  x: uptime,  y: loadavg[0] });
    data.loadavg5.push({  x: uptime,  y: loadavg[1] });
    data.loadavg15.push({ x: uptime,  y: loadavg[2] });

}


updateData();
setInterval( updateData, 21000 ); // Every 21 sec



function getStats(req, res) {

    const html = `
        <html>
            <head>
                <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.1/Chart.min.js"></script>
            </head>
            <body>
                <canvas id="loadavg" width="10" height="10"></canvas>
                <canvas id="memoryUsage" width="10" height="10"></canvas>
                <script>

                var loadavgCtx = document.getElementById("loadavg").getContext('2d');
                loadavgCtx.canvas.width  = window.innerWidth - 50;
                loadavgCtx.canvas.height = window.innerHeight/2 - 50;

                var memoryUsageCtx = document.getElementById("memoryUsage").getContext('2d');
                memoryUsageCtx.canvas.width  = window.innerWidth - 50;
                memoryUsageCtx.canvas.height = window.innerHeight/2 - 50;


                Chart.scaleService.updateScaleDefaults('linear', {
                    ticks: {
                        min: 0,
                        beginAtZero: true
                    }
                });


                var loadavgChart = new Chart(loadavgCtx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'loadavg 1 min',
                            data: ${JSON.stringify(data.loadavg1)},
                            borderColor: 'red',
                            fill: false
                        },{
                            label: 'loadavg 5 min',
                            data: ${JSON.stringify(data.loadavg5)},
                            borderColor: 'green',
                            fill: false
                        },{
                            label: 'loadavg 15 min',
                            data: ${JSON.stringify(data.loadavg15)},
                            borderColor: 'blue',
                            fill: false
                        }]
                    },
                    options: {
                        scales: {
                            xAxes: [{
                                type: 'linear',
                                position: 'bottom'
                            }],
                        }
                    }
                });

                var memoryUsageChart = new Chart(memoryUsageCtx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            label: 'Heap total',
                            data: ${JSON.stringify(data.memoryUsage.heapTotal)},
                            borderColor: 'red',
                            fill: false
                        },{
                            label: 'Heap used',
                            data: ${JSON.stringify(data.memoryUsage.heapUsed)},
                            borderColor: 'blue',
                            fill: false
                        },{
                            label: 'RSS',
                            data: ${JSON.stringify(data.memoryUsage.rss)},
                            borderColor: 'green',
                            fill: false
                        },{
                            label: 'External',
                            data: ${JSON.stringify(data.memoryUsage.external)},
                            borderColor: 'black',
                            fill: false
                        }]
                    },
                    options: {
                        scales: {
                            xAxes: [{
                                type: 'linear',
                                position: 'bottom'
                            }],
                        }
                    }
                });

                </script>
            </body>
        </html>`;

    res.send(html);
}


var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
require('child_process').exec(`${start} http://localhost:3000`);
