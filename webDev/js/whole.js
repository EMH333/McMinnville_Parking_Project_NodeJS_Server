/* eslint-disable no-unused-vars */
document.addEventListener('DOMContentLoaded', async function() {
  updateTotalsGraph();
  document.getElementById('total-selector').addEventListener('change', function(evnt) {
    updateTotalsGraph();
  });


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
    data[0][i+1] = date;
    const start = Math.round(date.getTime()/1000);

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


// eslint-disable-next-line new-cap
const totalCache = new cache();
/**
 * updates the total graph
 */
async function updateTotalsGraph() {
  const total = c3.generate({
    bindto: '#total-over-time',
    data: {
      x: 'x',
      columns: [
        // year month day
        ['x', '2019-01-01'],
        ['Total Cars In Garage', 0],
      ],
    },
    axis: {
      x: {
        type: 'timeseries',
        tick: {
          format: '%d-%b-%Y %H:%M',
        },
      },
    },
  });

  const daysToGetDataFor = document.getElementById('total-selector').value;
  let interval = getXMinutesInEpoch(60);
  let numIntervals = 24;// how many intervals per day
  if (daysToGetDataFor === 1) {
    interval = getXMinutesInEpoch(30);
    numIntervals = 48;
  } else if (daysToGetDataFor === 4) {
    interval = getXMinutesInEpoch(60 * 2);
    numIntervals = 12;
  } else if (daysToGetDataFor === 7) {
    interval = getXMinutesInEpoch(60 * 4);
    numIntervals = 6;
  }
  const data = [['x'], ['Total Cars In Garage']];
  // eslint-disable-next-line prefer-const
  let promises = [];
  const date = new Date(getTodaysEpoch()*1000);
  for (let i = 0; i < daysToGetDataFor * numIntervals; i++) {
    const time = Math.round(date.getTime()/1000) - (i * interval);
    const displayDate = new Date(time * 1000);


    // let options = {
    //  weekday: 'long',
    //  year: 'numeric',
    //  month: 'short',
    //  day: '2-digit',
    // };
    // displayDate.toLocaleDateString('en-US', options)
    data[0][i+1] = displayDate;


    const cacheKey = time;
    if (typeof totalCache.get(cacheKey)!=='undefined') {
      // key in cache, serve from there
      data[1][i+1] = totalCache.get(cacheKey);
    } else {
      promises.push(
          new Promise(async function(resolve) {
            // key not in cache, fetch from server
            data[1][i+1] = await fetch('/data/total/'+time).then(async function(data) {
              json = await data.json();
              return json.cars;
            });
            totalCache.set(cacheKey, data[1][i+1]);
            resolve();
          })
      );
    }
  }

  await Promise.all(promises);
  total.load({columns: data});
}
