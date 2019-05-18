document.addEventListener('DOMContentLoaded', async function() {
  updateTotalsGraph();
  document.getElementById('time-selector').addEventListener('change', function(evnt) {
    updateTotalsGraph();
  });
});


// eslint-disable-next-line new-cap
const totalCache = new cache();
/**
 * updates the total graph
 */
async function updateTotalsGraph() {
  const total = c3.generate({
    bindto: '#total',
    data: {
      type: 'pie',
      columns: [
        ['Loading', 0],
      ],
    },
  });

  const daysToGetDataFor = parseInt(document.getElementById('time-selector').value);
  const dayInTime = getXMinutesInEpoch(60*24);
  const today = new Date(getTodaysEpoch()*1000);
  const start = Math.round(today.getTime()/1000) - (daysToGetDataFor * dayInTime);
  const data = [];

  const nodes = await fetch('/data/nodeinfo').then(async function(data) {
    json = await data.json();
    return json.nodes;
  });

  for (let i = 0; i < nodes.length; i++) {
    const node = [];
    node[0] = nodes[i].name;// set graph id to name of each node
    const cacheKey = nodes[i].id+'_'+daysToGetDataFor;// note key is per node and per days
    if (typeof totalCache.get(cacheKey)!=='undefined') {
      // key in cache, serve from there
      node[1] = totalCache.get(cacheKey);
    } else {
      // key not in cache, fetch from server
      node[1] = await fetch('/data/'+nodes[i].id+'/events/'+start+'/'+(daysToGetDataFor * dayInTime))
          .then(async function(data) {
            json = await data.json();
            return json.events;
          });
      totalCache.set(cacheKey, node[1]);
    }
    data.push(node);
  }
  total.load({columns: data});
  total.unload({ids: 'Loading'});
}
