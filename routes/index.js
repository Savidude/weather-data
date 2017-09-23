var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Weather Data' });
});

/* GET weather stations page. */
router.get('/stations', function(req, res, next) {
    res.render('stations', { title: 'Weather Data' });
});

module.exports = router;
