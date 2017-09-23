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

router.get('/station/:id', function(req, res, next) {
    var wsid = req.params.id;
    res.render('station-info', { title: 'Weather Data', wsid: wsid });
});

module.exports = router;
