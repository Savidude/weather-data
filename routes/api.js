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

/* GET users listing. */
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
                    logger.error("Error while validating weather data");
                    db.close;
                    res.status(500).send();
                    throw err;
                } else {
                    if (result === null) {
                        logger.warn("Unauthorized access", data);
                        db.close;
                        res.status(401).send();
                    } else {
                        var temp = data.temp;
                        var humidity = data.humidity;
                        var rainfall = data.rainfall;
                        var windspd = data.windspd;
                        var winddir = data.winddir;

                        var weatherData = db.collection('WeatherData');
                        var currentData = {};
                        currentData.wsid = wsid;

                        var currentdate = new Date;
                        var timestamp = currentdate.getFullYear() + "-"
                            + (currentdate.getMonth()+1)  + "-"
                            + currentdate.getDate() + "T"
                            + currentdate.getHours() + ":"
                            + currentdate.getMinutes() + ":"
                            + currentdate.getSeconds();
                        currentData.recDateTime = timestamp;
                        currentData.temp = temp;
                        currentData.humidity = humidity;
                        currentData.rainfall = rainfall;
                        currentData.windspd = windspd;
                        currentData.winddir = winddir;

                        //Inserting the obtained weather data to database
                        weatherData.insertOne(currentData, function (err, result) {
                            if (err) {
                                logger.error("Error while inserting weather data", currentData);
                                res.status(500).send();
                                db.close;
                                throw err;
                            } else {
                                logger.info("Added weather data to database", currentData);
                                db.close;
                                res.status(201).send();
                            }
                        });
                    }
                }
            });
        }
    });
});

module.exports = router;
