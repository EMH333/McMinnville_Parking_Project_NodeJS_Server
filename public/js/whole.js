/* eslint-disable no-unused-vars */
document.addEventListener('DOMContentLoaded', async function() {
  const total = c3.generate({
    bindto: '#total-over-time',
    data: {
      x: 'x',
      columns: [
        ['x', '2019-01-01'],
        ['Total', 0],
      ],
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%d-%b-%Y',
        },
      },
    },
  });
  const time = await fetch('/data/time').then(function(res) {
    return res.json();
  }).then(function(data) {
    return data.time;
  });
});
