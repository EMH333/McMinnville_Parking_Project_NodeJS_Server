const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const database = require('../database');
const time = require('../webDev/shared/time');

/* This will be where all data comes from, served from backends backend */

router.get('/add', function(req, res) {
  database.addCar(true, Math.floor(Math.random() * 3),
      time.getCurrentTime()).then(function() {
    res.write('{"status":"ok"}');
    res.send();
  });
});
router.get('/add/:days', function(req, res) {
  database.addCar(true, Math.floor(Math.random() * 3),
      time.getCurrentTime()-time.getXMinutesInEpoch(parseInt(req.params.days)*24*60))
      .then(function() {
        res.write('{"status":"ok"}');
        res.send();
      });
});
router.get('/remove', function(req, res) {
  database.addCar(false, Math.floor(Math.random() * 3),
      time.getCurrentTime()).then(function() {
    res.write('{"status":"ok"}');
    res.send();
  });
});
router.get('/remove/:days', function(req, res) {
  database.addCar(false, Math.floor(Math.random() * 3),
      1+time.getCurrentTime()-time.getXMinutesInEpoch(parseInt(req.params.days)*24*60))
      .then(function() {
        res.write('{"status":"ok"}');
        res.send();
      });
});

module.exports = router;
