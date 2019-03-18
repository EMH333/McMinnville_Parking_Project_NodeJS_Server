var express = require('express');
var router = express.Router();
var database = require("../database");


var data = require('./data');

router.use('/data', data);


/* GET home page. */
router.get('/', function (req, res) {
  database.getCarsInGarage().then(currentCars => {
    res.render('index', {
      currentCars
    });
  });
});

module.exports = router;