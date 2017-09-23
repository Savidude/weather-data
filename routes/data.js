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

router.get('/stations', function(req, res) {
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
                                    "rainfall": 1, "windspd": 1, "winddir": 1, "recDateTime": 1}];
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
                                            stationData.recDateTime = weatherDataResult.recDateTime;

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

router.get('/station/:id', function (req, res) {
    var wsid = req.params.id;

    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            db.close;
            res.status(500).send();
        } else {
            var weatherStation = db.collection('WeatherStation');
            var query = [{"id": wsid}, {"_id": 0, "name": 1}];
            weatherStation.findOne(query[0], query[1], function (err, result) {
                if (err) {
                    logger.error("Unable find weather station name", err);
                    db.close;
                    res.status(500).send();
                } else {
                    res.status(200).json(result);
                }
            })
        }
    });
});

router.get('/stations/:id', function (req, res) {
    //Getting start time and end time
    var data = req.query;
    var startTime = Number(data.start);
    var endTime = Number(data.end);

    var wsid = req.params.id;

    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            db.close;
            res.status(500).send();
        } else {
            var weatherData = db.collection('WeatherData');
            var query = [{"wsid": wsid, "recDateTime": {$gt : startTime, $lt : endTime}}, {"_id": 0, "temp": 1,
                "humidity": 1, "rainfall": 1, "windspd": 1, "winddir": 1, "recDateTime": 1}];
            weatherData.find(query[0], query[1]).toArray(function (err, result) {
                if (err) {
                    logger.error("Unable to connect to query from database", err);
                    db.close;
                    res.status(500).send();
                } else {
                    res.status(200).json(result);
                }
            });
        }
    });
});

router.get('/all/stations', function (req, res) {
    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            db.close;
            res.status(500).send();
        } else {
            var weatherStation = db.collection('WeatherStation');
            var sortquery = {"name": 1};
            weatherStation.find().sort(sortquery).toArray(function (err, result) {
                if (err) {
                    logger.error("Unable to connect to query from database", err);
                    db.close;
                    res.status(500).send();
                } else {
                    res.status(200).json(result);
                }
            });
        }
    });
});

router.get('/create/stations', function (req, res) {
    var data = req.query;

    var stationData = {};
    stationData.name = data.name;
    stationData.lat = parseFloat(data.lat);
    stationData.lon = parseFloat(data.lon);
    stationData.added_by = data.user;
    stationData.notify_email = data.email;
    stationData.notify_phone = data.phone;
    stationData.sim = data.sim;
    stationData.status = "Active";

    var token = require('rand-token').uid;
    stationData.id = token(8);
    stationData.key = token(8);

    var today = new Date();
    var dateTime = today.getDate() + "/"
        + (today.getMonth()+1)  + "/"
        + today.getFullYear() + " "
        + today.getHours() + ":"
        + (today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes()) + ":"
        + (today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds());
    stationData.added_date_time = dateTime;

    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            db.close;
            res.status(500).send();
        } else {
            var weatherStation = db.collection('WeatherStation');
            weatherStation.insertOne(stationData, function (err, result) {
                if (err) {
                    logger.error("Unable to insert weather data to database", err);
                    db.close;
                    res.status(500).send();
                } else {
                    res.status(201).json(stationData);
                }
            });
        }
    });
});

router.post('/update/station', function (req, res) {
    var stationData = req.body;

    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            db.close;
            res.status(500).send();
        } else {
            var weatherStation = db.collection('WeatherStation');
            var findQuery = [{"id": stationData.id},
                {"_id": 0, "name": 1, "id": 1, "key": 1, "lat": 1, "lon": 1, "added_by": 1, "notify_email": 1,
                    "notify_phone": 1, "sim": 1, "status": 1, "added_date_time": 1}];
            weatherStation.findOne(findQuery[0], findQuery[1], function (err, result) {
                if (err) {
                    logger.error("Unable to find station while updating.", err);
                    db.close;
                    res.status(500).send();
                } else {
                    result.name = stationData.name;
                    result.lat = stationData.lat;
                    result.lon = stationData.lon;
                    result.notify_email = stationData.email;
                    result.notify_phone = stationData.phone;
                    result.sim = stationData.sim;

                    var updateQuery = {"id": stationData.id};
                    weatherStation.updateOne(updateQuery, result, function (err, result2) {
                        if (err) {
                            logger.error("Unable to update station", err);
                            db.close;
                            res.status(500).send();
                        } else {
                            res.status(200).send();
                        }
                    });
                }
            });
        }
    });
});

router.get('/delete/station/id/:id/key/:key', function (req, res) {
    var wsid = req.params.id;
    var key = req.params.key;

    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            db.close;
            res.status(500).send();
        } else {
            var weatherStation = db.collection('WeatherStation');
            var query = {"id": wsid, "key": key};
            weatherStation.deleteOne(query, function (err, result) {
                if (err) {
                    logger.error("Unable to delete weather station", err);
                    db.close;
                    res.status(500).send();
                } else {
                    res.status(200).send();
                }
            });
        }
    });
});

module.exports = router;