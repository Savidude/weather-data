var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var fs = require('fs');

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

router.get('/stations', function(req, res, next) {
    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    //Storing latest weather data from all stations in array
    var stationDataArray = [];

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            db.close;
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
                    logger.error("Error while querying weather data", err);
                    db.close;
                    res.status(500).send();
                    throw err;
                } else {
                    var weatherStation = db.collection('WeatherStation');
                    var stationCount = 0;
                    result.forEach(function (station) {
                        var wsid = station._id;
                        var stationData = {};
                        stationData.wsid = wsid;

                        //Getting weather station data from the id;
                        var weatherStationQuery = [{"id": wsid}, {"_id": 0, "name": 1, "lat": 1, "lon": 1}];
                        weatherStation.findOne(weatherStationQuery[0], weatherStationQuery[1], function (err, weatherStationResult) {
                            if (err) {
                                logger.error("Error while querying weather data", err);
                                db.close;
                                res.status(500).send();
                                throw err;
                            } else {
                                //Storing weather station data in object
                                stationData.name = weatherStationResult.name;
                                stationData.lat = weatherStationResult.lat;
                                stationData.lon = weatherStationResult.lon;

                                //Getting weather data
                                var weatherDataQuery = [{"recTime": station.last}, {"_id": 0, "temp": 1, "humidity": 1,
                                    "rainfall": 1, "windspd": 1, "winddir": 1}];
                                findStationData(weatherData, weatherDataQuery, function (err, weatherDataResult) {
                                    if (err) {
                                        logger.error("Error while querying weather data", err);
                                        db.close;
                                        res.status(500).send();
                                        throw err;
                                    } else {
                                        if (weatherDataResult !== null) {
                                            // Storing weather data in object
                                            stationData.temp = weatherDataResult.temp;
                                            stationData.humidity = weatherDataResult.humidity;
                                            stationData.rainfall = weatherDataResult.rainfall;
                                            stationData.windspd = weatherDataResult.windspd;
                                            stationData.winddir = weatherDataResult.winddir;

                                            stationDataArray.push(stationData);
                                        }

                                        if (stationCount === result.length - 1) {
                                            logger.info("Weather station data requested");
                                            db.close();
                                            res.status(200).json(stationDataArray);
                                        }
                                        stationCount++;
                                    }
                                })
                            }
                        });
                    });
                }
            });
        }
    });

    var findStationData = function (weatherData, weatherDataQuery, callback) {
        weatherData.findOne(weatherDataQuery[0], weatherDataQuery[1], function (err, result) {
            if (err) {
                callback(err);
            } else {
                callback(null, result);
            }
        });
    }
});

module.exports = router;