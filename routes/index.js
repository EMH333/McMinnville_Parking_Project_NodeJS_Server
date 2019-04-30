var express = require('express');
var router = express.Router();
var database = require("../database");


var data = require('./data');

router.use('/data', data);


/* GET home page. */
router.get('/', function (req, res) {

  //get current cars in garage
  var total = database.getCarsInGarage()
  //get throughput for last hour
  var throughput = database.getCarThroughput(database.getEpochXMinutesAgo(60), database.getXMinutesInEpoch(60))

  Promise.all([total, throughput]).then(function (values) {
    res.render('index', {
      currentCars: values[0],
      throughput: values[1]
    });
  })


});

router.get('/whole', function (req, res) {
  res.render('wholeGarage');
});

module.exports = router;