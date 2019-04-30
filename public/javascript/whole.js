document.addEventListener("DOMContentLoaded", async function () {
    var total = c3.generate({
        bindto: '#total-over-time',
        data: {
            x: 'x',
            columns: [
                ['x', '2019-01-01'],
                ['Total', 0],
            ]
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%d-%b-%Y'
                }
            }
        }
    });
    var time = await fetch('/data/time').then(function (res) {
        return res.json()
    }).then(function (data) {
        return data.time;
    });

    
});