var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var fs = require('fs');
var path = require('path');

//Instantiating logger
var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            filename: 'log/api.log',
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

router.get('/data/add', function(req, res, next) {
    //Getting weather station ID and key
    var data = req.query;
    var wsid = data.wsid;
    var key = data.key;

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
            //Validating key and ID with the sent weather data
            var query = {"id": wsid, "key": key};
            weatherStation.findOne(query, function (err, result) {
                if (err) {
                    logger.error("Error while validating weather data", err);
                    db.close;
                    res.status(500).send();
                    throw err;
                } else {
                    if (result === null) {
                        logger.warn("Unauthorized access", data);
                        db.close;
                        res.status(401).send();
                    } else {
                        if (result.status === "Inactive") {
                            result.status = "Active";

                            weatherStation.updateOne(query, result, function (err, res) {
                                if (err) {
                                    logger.error("Error while querying weather data", err);
                                    res.status(500).send();
                                    throw err;
                                } else {
                                    logger.info("Weather station status changed back to active: " + result.name);
                                }
                            });
                        }

                        var temp = data.temp;
                        var humidity = data.humidity;
                        var rainfall = data.rainfall;
                        var windspd = data.windspd;
                        var winddir = data.winddir;

                        var battery = data.battery;
                        var signal = data.signal;

                        var weatherData = db.collection('WeatherData');
                        var currentData = {};
                        currentData.wsid = wsid;

                        currentData.recDateTime = Number(data.rectime);
                        currentData.temp = Number(temp);
                        currentData.humidity = Number(humidity);
                        currentData.rainfall = Number(rainfall);
                        currentData.windspd = Number(windspd);
                        currentData.winddir = Number(winddir);

                        currentData.battery = Number(battery);
                        currentData.signal = Number(signal);
                        currentData.recTime = Math.floor(Date.now());

                        //Inserting the obtained weather data to database
                        weatherData.insertOne(currentData, function (err, result) {
                            if (err) {
                                logger.error("Error while inserting weather data", err);
                                res.status(500).send();
                                db.close;
                                throw err;
                            } else {
                                logger.info("Added weather data to database", currentData);
                                db.close;
                                res.status(201).send("success");
                            }
                        });
                    }
                }
            });
        }
    });
});

router.get('/data/add/v2', function(req, res, next) {
    //Getting weather station ID and key
    var data = req.query;
    var wsid = data.ID;
    var key = data.KEY;

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
            //Validating key and ID with the sent weather data
            var query = {"id": wsid, "key": key};
            weatherStation.findOne(query, function (err, result) {
                if (err) {
                    logger.error("Error while validating weather data", err);
                    db.close;
                    res.status(500).send();
                    throw err;
                } else {
                    if (result === null) {
                        logger.warn("Unauthorized access", data);
                        db.close;
                        res.status(401).send();
                    } else {
                        if (result.status === "Inactive") {
                            result.status = "Active";

                            weatherStation.updateOne(query, result, function (err, res) {
                                if (err) {
                                    logger.error("Error while querying weather data", err);
                                    res.status(500).send();
                                    throw err;
                                } else {
                                    logger.info("Weather station status changed back to active: " + result.name);
                                }
                            });
                        }

                        var temp = data.TP;
                        var humidityTemperature = data.TH;
                        var humidity = data.H;
                        var rainfall = data.R;
                        var windspd = data.S;
                        var winddir = data.D;
                        var pressure = data.P;

                        var battery = data.B;
                        var solarVoltage = data.SV;
                        var externalVoltage = data.EV;
                        var accelerometerZ = data.Z;
                        var signal = data.SI;
                        var errorFlag = data.F;

                        var weatherData = db.collection('WeatherData');
                        var currentData = {};
                        currentData.wsid = wsid;

                        currentData.recDateTime = Number(data.TIME * 1000);
                        currentData.temp = Math.round(Number(temp));
                        currentData.humidityTemperature = Math.round(Number(humidityTemperature));
                        currentData.humidity = Number(humidity);
                        currentData.rainfall = Number(rainfall);
                        currentData.windspd = Number(windspd);
                        currentData.winddir = Number(winddir);
                        currentData.pressure = Number(pressure);

                        currentData.battery = Number(battery);
                        currentData.solarVoltage = Number(solarVoltage);
                        currentData.externalVoltage = Number(externalVoltage);
                        currentData.accelerometerZ = Number(accelerometerZ);
                        currentData.signal = Number(signal);
                        currentData.errorFlag = Number(errorFlag);
                        currentData.recTime = Math.floor(Date.now());

                        //Inserting the obtained weather data to database
                        weatherData.insertOne(currentData, function (err, result) {
                            if (err) {
                                logger.error("Error while inserting weather data", err);
                                res.status(500).send();
                                db.close;
                                throw err;
                            } else {
                                logger.info("Added weather data to database", currentData);
                                db.close;
                                res.status(201).send("success");
                            }
                        });
                    }
                }
            });
        }
    });
});

router.get('/station/:id', function (req, res) {
    var wsid = req.params.id;

    var startTimestamp, endTimestamp;
    var today = new Date();

    if (today.getHours() < 8) {
        var yesterday = new Date();
        yesterday.setDate(today.getDate() -1);
        yesterday.setHours(8);
        startTimestamp = yesterday.getTime();

        today.setHours(8);
        endTimestamp = today.getTime();
    } else {
        today.setHours(8);
        startTimestamp = today.getTime();

        var tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        tomorrow.setHours(8);
        endTimestamp = tomorrow.getTime();
    }

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
            var query = [{"wsid": wsid, "recDateTime": {$gt : startTimestamp, $lt : endTimestamp}}, {"_id": 0, "temp": 1,
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


//Get logs
router.get('/logs/api', function (req, res) {
    var filepath = __dirname + '/../log/api.log';
    fs.readFile(filepath, 'utf8', function (err, data) {
        if (err){
            console.log(err);
        } else {
            res.send(data);
        }
    });
});

module.exports = router;