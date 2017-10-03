var express = require('express');
var router = express.Router();

var mongodb = require('mongodb');
var fs = require('fs');

var session = require('express-session');
router.use(session({
    secret: 'dg9LEugPw659nR82',
    resave: false,
    saveUninitialized: true
}));

//Instantiating logger
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            filename: 'log/data.log',
            timestamp: function() {
                var currentdate = new Date;
                var timestamp = currentdate.getFullYear() + "-"
                    + (currentdate.getMonth()+1)  + "-"
                    + currentdate.getDate() + "T"
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
                return timestamp;
            },
            formatter: function(options) {
                // Return string will be passed to logger.
                return options.timestamp() +' ['+ options.level.toUpperCase() +'] '+ (options.message ? options.message : '') +
                    (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
            },
            json:false
        })
    ]
});

/* GET home page. */
router.get('/', function(req, res, next) {
    var key = req.session.key;
    if (key === undefined) {
        res.render('index', { title: 'Weather Data', username: 'Guest', name: 'Guest', type: 'guest' });
    } else {
        validateKey(key, function (result) {
            if (result === null) {
                res.render('index', { title: 'Weather Data', username: 'Guest', name: 'Guest', type: 'guest' });
            } else {
                res.render('index', { title: 'Weather Data', username: result.username, name: result.name, type: result.user_type });
            }
        });
    }
});

/* GET weather stations page. */
router.get('/stations', function(req, res, next) {
    var key = req.session.key;
    if (key === undefined) {
        res.status(401).send();
    } else {
        validateKey(key, function (result) {
            var user_type = result.user_type;
            if (user_type === 'admin' || user_type === 'superadmin') {
                res.render('stations', { title: 'Weather Data', username: result.username, name: result.name, type: result.user_type });
            } else {
                res.status(401).send();
            }
        });
    }
});

router.get('/station/:id', function(req, res, next) {
    var key = req.session.key;
    if (key === undefined) {
        res.status(401).send();
    } else {
        validateKey(key, function (result) {
            var user_type = result.user_type;
            if (user_type === 'admin' || user_type === 'superadmin') {
                var wsid = req.params.id;
                res.render('station-info', { title: 'Weather Data', username: result.username, name: result.name,
                    type: result.user_type, wsid: wsid });
            } else {
                res.status(401).send();
            }
        });
    }
});

/* GET weather stations page. */
router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Weather Data' });
});

module.exports = router;

function validateKey(key, callback) {
    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
        } else {
            var users = db.collection('users');
            var findQuery = [{"key": key},
                {"_id": 0, "username": 1, "name": 1, "user_type": 1}];
            users.findOne(findQuery[0], findQuery[1], function (err, result) {
                if (err) {
                    logger.error("Error while trying to get user data", err);
                } else {
                    callback(result);
                    db.close();
                }
            });
        }
    });
}