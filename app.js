var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//Instantiating logger
var winston = require('winston');
var wlogger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            filename: 'log/activity.log',
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

var index = require('./routes/index');
var api = require('./routes/api');
var data = require('./routes/data');

var schedule = require('node-schedule');
var mongodb = require('mongodb');
var fs = require('fs');

//Schedules to check the last activity of a weather station every 30 minutes
var j = schedule.scheduleJob('*/30 * * * *', function(){
    checkStationActivity();
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api', api);
app.use('/data', data);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

function checkStationActivity() {
    wlogger.info("Checking for inactive weather stations");

    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            wlogger.error("Unable to connect to the Database", err);
            res.status(500).send();
        } else {
            var weatherData = db.collection('WeatherData');
            var query = {
                $group:{
                    _id: '$wsid',
                    last: {
                        $max: "$recTime"
                    }
                }
            };
            weatherData.aggregate(query, function (err, result) {
                if (err) {
                    wlogger.error("Error while querying weather data", err);
                    res.status(500).send();
                    throw err;
                } else {
                    var weatherStation = db.collection('WeatherStation');
                    var stationCount = 0;
                    result.forEach(function (station) {
                        var wsid = station._id;
                        var lastRecordedTimeDifference = Date.now() - station.last;
                        if (lastRecordedTimeDifference > 3600000) {
                            var weatherStationQuery = {"id": wsid};
                            weatherStation.findOne(weatherStationQuery, function (err, weatherStationResult) {
                                if (err) {
                                    wlogger.error("Error while querying weather data", err);
                                    res.status(500).send();
                                    throw err;
                                } else {
                                    if (weatherStationResult !== null) {
                                        if (weatherStationResult.status === "Active") {
                                            //Change station status to inactive is unresponsive for more than 30 minutes
                                            weatherStationResult.status = "Inactive";
                                            weatherStation.updateOne(weatherStationQuery, weatherStationResult, function (err, res) {
                                                if (err) {
                                                    wlogger.error("Error while querying weather data", err);
                                                    res.status(500).send();
                                                    throw err;
                                                } else {
                                                    wlogger.info("Inactive Weather Station Detected: " + weatherStationResult.name);
                                                    //TODO: Send Email and SMS
                                                    db.close();
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}