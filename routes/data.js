var express = require('express');
var session = require('express-session');
var router = express.Router();

router.use(session({
    secret: 'dg9LEugPw659nR82',
    resave: false,
    saveUninitialized: true,
}));

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

/*
Getting the most recent weather data from all stations
 */
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
                                res.status(500).send();
                                throw err;
                            } else {
                                if (weatherStationResult !== null) {
                                    try {
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
                                        });
                                    } catch (err) {
                                        logger.warn(err);
                                    }
                                } else {
                                    if (stationCount === result.length - 1) {
                                        logger.info("Weather station data requested");
                                        db.close();
                                        res.status(200).json(stationDataArray);
                                    }
                                    stationCount++;
                                }
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
    };
});

/*
Getting the name of a single station
 */
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
            res.status(500).send();
        } else {
            var weatherStation = db.collection('WeatherStation');
            var query = [{"id": wsid}, {"_id": 0, "name": 1}];
            weatherStation.findOne(query[0], query[1], function (err, result) {
                if (err) {
                    logger.error("Unable find weather station name", err);
                    res.status(500).send();
                } else {
                    db.close();
                    res.status(200).json(result);
                }
            })
        }
    });
});

/*
Getting weather data of a single station
 */
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
            res.status(500).send();
        } else {
            var weatherData = db.collection('WeatherData');
            var query = [{"wsid": wsid, "recDateTime": {$gt : startTime, $lt : endTime}}, {"_id": 0, "temp": 1,
                "humidity": 1, "rainfall": 1, "windspd": 1, "winddir": 1, "recDateTime": 1}];
            weatherData.find(query[0], query[1]).toArray(function (err, result) {
                if (err) {
                    logger.error("Unable to connect to query from database", err);
                    res.status(500).send();
                } else {
                    db.close();
                    res.status(200).json(result);
                }
            });
        }
    });
});

/*
Getting health data of a single station
 */
router.get('/stations/health/:id', function (req, res) {
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
            res.status(500).send();
        } else {
            var weatherData = db.collection('WeatherData');
            var query = [{"wsid": wsid, "recDateTime": {$gt : startTime, $lt : endTime}}, {"_id": 0, "recDateTime" : 1, "battery": 1, "signal": 1}];
            weatherData.find(query[0], query[1]).toArray(function (err, result) {
                if (err) {
                    logger.error("Unable to connect to query from database", err);
                    res.status(500).send();
                } else {
                    db.close();
                    res.status(200).json(result);
                }
            });
        }
    });
});


/*
Getting data of all stations in alphabetical order
 */
router.get('/all/stations', function (req, res) {
    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            res.status(500).send();
        } else {
            var weatherStation = db.collection('WeatherStation');
            var sortquery = {"name": 1};
            weatherStation.find().sort(sortquery).toArray(function (err, result) {
                if (err) {
                    logger.error("Unable to connect to query from database", err);
                    res.status(500).send();
                } else {
                    db.close();
                    res.status(200).json(result);
                }
            });
        }
    });
});

/*
Creating new station
 */
router.get('/create/stations', function (req, res) {
    var key = req.session.key;
    if (key === undefined) {
        res.status(401).send();
    } else {
        validateKey(key, function (result) {
            var user_type = result.user_type;
            if (user_type === 'superadmin') {
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
                        res.status(500).send();
                    } else {
                        var weatherStation = db.collection('WeatherStation');
                        weatherStation.insertOne(stationData, function (err, result) {
                            if (err) {
                                logger.error("Unable to insert weather data to database", err);
                                res.status(500).send();
                            } else {
                                db.close();
                                res.status(201).json(stationData);
                            }
                        });
                    }
                });
            } else {
                res.status(401).send();
            }
        });
    }
});

/*
Updating existing station
 */
router.post('/update/station', function (req, res) {
    var key = req.session.key;
    if (key === undefined) {
        res.status(401).send();
    } else {
        validateKey(key, function (result) {
            var user_type = result.user_type;
            if (user_type === 'superadmin') {
                var stationData = req.body;

                //Create MongoDB client and connect to it
                var mongoClient = mongodb.MongoClient;
                var contents = fs.readFileSync("routes/config.json");
                var jsonContent = JSON.parse(contents);
                var mongoDBUrl= jsonContent.mongoDBUrl;

                mongoClient.connect(mongoDBUrl, function (err, db) {
                    if (err) {
                        logger.error("Unable to connect to the Database", err);
                        res.status(500).send();
                    } else {
                        var weatherStation = db.collection('WeatherStation');
                        var findQuery = [{"id": stationData.oldId},
                            {"_id": 0, "name": 1, "id": 1, "key": 1, "lat": 1, "lon": 1, "added_by": 1, "notify_email": 1,
                                "notify_phone": 1, "sim": 1, "status": 1, "added_date_time": 1}];
                        weatherStation.findOne(findQuery[0], findQuery[1], function (err, result) {
                            if (err) {
                                logger.error("Unable to find station while updating.", err);
                                res.status(500).send();
                            } else {
                                result.name = stationData.name;
                                result.id = stationData.id;
                                result.key = stationData.key;
                                result.lat = stationData.lat;
                                result.lon = stationData.lon;
                                result.notify_email = stationData.email;
                                result.notify_phone = stationData.phone;
                                result.sim = stationData.sim;

                                var updateQuery = {"id": stationData.oldId};
                                weatherStation.updateOne(updateQuery, result, function (err, result2) {
                                    if (err) {
                                        logger.error("Unable to update station", err);
                                        res.status(500).send();
                                    } else {
                                        db.close();
                                        var response = {};
                                        response.status = 200;
                                        res.status(200).json(response);
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.status(401).send();
            }
        });
    }
});

/*
Deleting existing station
 */
router.get('/delete/station/id/:id/key/:key', function (req, res) {
    var key = req.session.key;
    if (key === undefined) {
        res.status(401).send();
    } else {
        validateKey(key, function (result) {
            var user_type = result.user_type;
            if (user_type === 'superadmin') {
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
                        res.status(500).send();
                    } else {
                        var weatherStation = db.collection('WeatherStation');
                        var query = {"id": wsid, "key": key};
                        weatherStation.deleteOne(query, function (err, result) {
                            if (err) {
                                logger.error("Unable to delete weather station", err);
                                res.status(500).send();
                            } else {
                                db.close();
                                res.status(200).send();
                            }
                        });
                    }
                });
            } else {
                res.status(401).send();
            }
        });
    }
});

/*
Validating a station by its ID and Key
 */
router.post('/validate/station', function (req, res) {
    var key = req.session.key;
    if (key === undefined) {
        res.status(401).send();
    } else {
        validateKey(key, function (result) {
            var user_type = result.user_type;
            if (user_type === 'superadmin') {
                var data = req.body;

                var id = data.id;
                var key = data.key;

                //Create MongoDB client and connect to it
                var mongoClient = mongodb.MongoClient;
                var contents = fs.readFileSync("routes/config.json");
                var jsonContent = JSON.parse(contents);
                var mongoDBUrl= jsonContent.mongoDBUrl;

                mongoClient.connect(mongoDBUrl, function (err, db) {
                    if (err) {
                        logger.error("Unable to connect to the Database", err);
                        res.status(500).send();
                    } else {
                        var weatherStation = db.collection('WeatherStation');

                        var findIdQuery = { "id": id };
                        weatherStation.findOne(findIdQuery, function (err, result) {
                            if (err) {
                                logger.error("Error while validating weather data", err);
                                db.close;
                                res.status(500).send();
                                throw err;
                            } else {
                                if (result !== null) {
                                    //If a matching ID is found
                                    var response = {};
                                    response.message = "Invalid ID. A weather station with the entered ID already exists.";
                                    res.status(409).json(response);
                                } else {
                                    //If a matching ID is not found
                                    var findKeyQuery = { "key" : key };
                                    weatherStation.findOne(findKeyQuery, function (err, result) {
                                        if (err) {
                                            logger.error("Error while validating weather data", err);
                                            db.close;
                                            res.status(500).send();
                                            throw err;
                                        } else {
                                            if (result !== null) {
                                                //If a matching key is found
                                                var response = {};
                                                response.message = "Invalid Key. A weather station with the entered key already exists.";
                                                res.status(409).json(response);
                                            } else {
                                                //If a matching key is not found
                                                db.close();
                                                var response2= {};
                                                response2.status = 200;
                                                res.status(200).json(response2);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            } else {
                res.status(401).send();
            }
        });
    }
});

/*
Writing weather data to a .csv file
 */
router.post('/download', function (req, res) {
    var data = req.body;

    var json2csv = require('json2csv');
    var fs = require('fs');
    var fields = ['recDateTime', 'temp', 'humidity', 'rainfall', 'windspd', 'winddir'];
    var csv = json2csv({data: data, fields: fields});

    fs.writeFile('data/weatherData.csv', csv, function(err) {
        if (err) {
            logger.error("Error while creating .csv file", err);
            throw err;
        } else {
            logger.info(".csv file created");
            res.status(200).send();
        }
    });
});

/*
Downloading .csv file with weather data
 */
router.get('/download', function (req, res ) {
    var data = req.query;
    var filename = data.filename + "WeatherData.csv";
    var filepath = __dirname + '/../data/weatherData.csv';
    res.download(filepath, filename, function (err) {
        if( err ) {
            logger.error("Error while downloading CSV file", err);
        } else {
            logger.info(".csv file downloaded");
        }
    });
});

/*
Validating username and password and providing session key
 */
router.post('/login', function (req, res) {
    var userData = req.body;

    //Create MongoDB client and connect to it
    var mongoClient = mongodb.MongoClient;
    var contents = fs.readFileSync("routes/config.json");
    var jsonContent = JSON.parse(contents);
    var mongoDBUrl= jsonContent.mongoDBUrl;

    mongoClient.connect(mongoDBUrl, function (err, db) {
        if (err) {
            logger.error("Unable to connect to the Database", err);
            res.status(500).send();
        } else {
            var users = db.collection('users');
            var findQuery = [{"username": userData.username, "password": userData.password},
                {"_id": 0, "key": 1}];
            users.findOne(findQuery[0], findQuery[1], function (err, result) {
                if (err) {
                    logger.error("Error while trying to login", err);
                    res.status(500).send();
                } else {
                    if (result === null) {
                        db.close();
                        res.status(401).send();
                    } else {
                        var hour = 3600000;
                        req.session.cookie.expires = new Date(Date.now() + hour);
                        req.session.cookie.maxAge = hour;

                        req.session.key = result.key;
                        var response = {};
                        response.status = 200;
                        db.close();
                        res.status(200).json(response);
                    }
                }
            });
        }
    });
});

/*
Logging out user by removing session key
 */
router.post('/logout', function (req, res) {
    req.session.key = undefined;
    res.status(200).send();
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
                {"_id": 0, "user_type": 1}];
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