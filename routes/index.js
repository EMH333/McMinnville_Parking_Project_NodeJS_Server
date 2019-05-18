const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const database = require('../database');
const config = require('../config');


const data = require('./data');
router.use('/data', data);

if (config.env == 'development') {
  const add = require('./add-car');
  router.use('/car', add);
}


/* GET home page. */
router.get('/', function(req, res) {
  // get current cars in garage
  const total = database.getCarsInGarage();
  // get throughput for last hour
  const throughput = database.getCarThroughput(database.getEpochXMinutesAgo(60), database.getXMinutesInEpoch(60));

  Promise.all([total, throughput]).then(function(values) {
    res.render('index', {
      currentCars: values[0],
      throughput: values[1],
      utilization: (values[0]/config.totalSpots).toFixed(3),
    });
  });
});

router.get('/whole', function(req, res) {
  res.render('wholeGarage');
});

module.exports = router;
