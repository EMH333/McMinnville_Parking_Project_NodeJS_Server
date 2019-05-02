/* eslint-disable no-unused-vars */
document.addEventListener('DOMContentLoaded', async function() {
  updateThroughputGraph();

  document.getElementById('throughput-selector').addEventListener('change', function(evnt) {
    updateThroughputGraph();
  });
});
// eslint-disable-next-line new-cap
const throughputCache = new cache();
/**
 * updates the throughput graph
 */
async function updateThroughputGraph() {
  const throughput = c3.generate({
    bindto: '#throughput-over-time',
    data: {
      x: 'x',
      columns: [
        // year month day
        ['x', '2019-01-01'],
        ['Throughput', 0],
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

  const daysToGetDataFor = document.getElementById('throughput-selector').value;
  const dayInTime = getXMinutesInEpoch(60*24);
  const data = [['x'], ['Throughput']];
  for (i = 0; i < daysToGetDataFor; i++) {
    const date = new Date(getTodaysEpoch()*1000);
    date.setDate(date.getDate()-daysToGetDataFor+i+1);
    data[0][i+1] = date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();

    const start = Math.round(date.getTime()/1000);
    console.log(date.getTime() + ' start:' + start);

    const cacheKey = date.getDate()+'_'+dayInTime;
    if (typeof throughputCache.get(cacheKey)!=='undefined') {
      // key in cache, serve from there
      data[1][i+1] = throughputCache.get(cacheKey);
    } else {
      // key not in cache, fetch from server
      data[1][i+1] = await fetch('/data/thru/'+start+'/'+dayInTime).then(async function(data) {
        json = await data.json();
        return json.throughput;
      });
      throughputCache.set(cacheKey, data[1][i+1]);
    }
  }
  throughput.load({columns: data});
}
