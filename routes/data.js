var express = require('express');
var router = express.Router();

/* This will be where all data comes from, served from backends backend */
var EPOCH = new Date("01-Jan-2019");
function getCurrentTime(){
  //in seconds, the system records data using minutes (preliminary 15 minute intervals)
  return Math.round((Date.now() - EPOCH) / 1000);
}

router.get('/', function(req, res) {
  res.write('{"status":"ok",');
  res.write('"currentTime":' + getCurrentTime())//TODO round this
  res.write('}');
  res.send();
});

//current cars in garage
router.get('/current', function(req, res) {
  res.send('{"status":"ok"}');//TODO implement
});

//cars in, time param in min since epoch, offset is number of mins since start time, can cache as this shouldn't change except most recent
router.get('/in/:start/:offset', function(req, res) {
  res.write('{"status":"ok",');//TODO implement
  res.write('"start":' + req.params.start + ",");
  res.write('"offset":' + req.params.offset + ",");
  res.write('}');
  res.send();
});

//cars out, time param in hours
router.get('/out/:start/:offset', function(req, res) {
  res.write('{"status":"ok",');//TODO implement
  res.write('"start":' + req.params.start + ",");
  res.write('"offset":' + req.params.offset + ",");
  res.write('}');
  res.send();
});

//cars throughput, time param in hours
router.get('/thru/:start/:offset', function(req, res) {
  res.write('{"status":"ok",');//TODO implement
  res.write('"start":' + req.params.start + ",");
  res.write('"offset":' + req.params.offset + ",");
  res.write('}');
  res.send();
});

module.exports = router;
