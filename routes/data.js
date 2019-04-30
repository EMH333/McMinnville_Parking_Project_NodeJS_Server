var express = require('express');
var router = express.Router();
var database = require("../database");

/* This will be where all data comes from, served from backends backend */

router.get('/', function (req, res) {
  res.write('{"status":"ok",');
  res.write('"currentTime":' + getCurrentTime()) //TODO round this
  res.write('}');
  res.send();
});

//current cars in garage
router.get('/current', function (req, res) {
  database.getCarsInGarage().then(cars => {
  res.send({
    "status": "ok",
    "cars": cars,
  });
  });
});

router.get('/time',function (req,res) { 
  res.send({
    "status": "ok",
    "time": database.getCurrentTime(),
  });
 });

//cars in, time param in min since epoch, offset is number of mins since start time, can cache as this shouldn't change except most recent
router.get('/in/:start/:offset', function (req, res) {
  //TODO implement
  res.write({
    "status": "ok",
    "start": req.params.start,
    "offset": req.params.offset,
  });
  res.send();
});

//cars out, time param in hours
router.get('/out/:start/:offset', function (req, res) {
  //TODO implement
  res.write({
    "status": "ok",
    "start": req.params.start,
    "offset": req.params.offset,
  });
  res.send();
});

//cars throughput, time param in hours
router.get('/thru/:start/:offset', function (req, res) {
  //TODO implement
  res.write({
    "status": "ok",
    "start": req.params.start,
    "offset": req.params.offset,
  });
  res.send();
});

module.exports = router;