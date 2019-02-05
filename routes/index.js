var express = require('express');
var router = express.Router();

var users = require('./users');

router.use('/test', users);


/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
