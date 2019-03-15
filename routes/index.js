var express = require('express');
var router = express.Router();

var data = require('./data');

router.use('/data', data);


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

module.exports = router;
