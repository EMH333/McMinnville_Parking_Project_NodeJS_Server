const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const database = require('../database');
const config = require('../config');

/* This will be where all data comes from, served from backends backend */

router.get('/', function(req, res) {
  res.write('{"status":"ok",');
  res.write('"currentTime":' + database.getCurrentTime()); // TODO round this
  res.write('}');
  res.send();
});

router.get('/nodeinfo', function(req, res) {
  res.set('Cache-Control', 'public, max-age=1800');
  res.send({
    'status': 'ok',
    'nodes': config.nodes,
  });
});

// current cars in garage
router.get('/current', function(req, res) {
  res.set('Cache-Control', 'public, max-age=5');
  database.getCarsInGarage().then((cars) => {
    res.send({
      'status': 'ok',
      'cars': cars,
    });
  });
});

router.get('/total/:time', function(req, res) {
  res.set('Cache-Control', 'public, max-age=604800');
  database.getCarsInGarage(false, parseInt(req.params.time)).then((cars) => {
    res.send({
      'status': 'ok',
      'time': parseInt(req.params.time),
      'cars': cars,
    });
  });
});

router.get('/time', function(req, res) {
  res.send({
    'status': 'ok',
    'time': database.getCurrentTime(),
  });
});

// cars in, time param in min since epoch, offset is number of mins since start time,
// can cache as this shouldn't change except most recent
router.get('/in/:start/:offset', function(req, res) {
  // TODO implement
  res.write({
    'status': 'ok',
    'start': req.params.start,
    'end': req.params.start+ req.params.offset,
  });
  res.send();
});

// cars out, time param in hours
router.get('/out/:start/:offset', function(req, res) {
  // TODO implement
  res.write({
    'status': 'ok',
    'start': req.params.start,
    'end': req.params.start+ req.params.offset,
  });
  res.send();
});

// cars throughput, time param in hours
router.get('/thru/:start/:offset', function(req, res) {
  res.set('Cache-Control', 'public, max-age=604800');
  const start = parseInt(req.params.start);
  const offset = parseInt(req.params.offset);
  database.getCarThroughput(start, offset).then((cars) => {
    res.send({
      'status': 'ok',
      'start': start,
      'end': start + offset,
      'throughput': cars,
    });
  });
});


router.get('/:nodeID/events/:start/:offset', function(req, res) {
  res.set('Cache-Control', 'public, max-age=604800');
  const nodeID = parseInt(req.params.nodeID);
  const start = parseInt(req.params.start);
  const offset = parseInt(req.params.offset);
  database.getCarsUsingExit(start, offset, nodeID, 2).then((cars) => {
    res.send({
      'status': 'ok',
      'node': nodeID,
      'start': start,
      'end': start + offset,
      'events': cars,
    });
  });
});

module.exports = router;
