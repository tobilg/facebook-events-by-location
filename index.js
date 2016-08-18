// Internal modules

// NPM modules
var express = require("express");
var morgan = require("morgan");
var cors = require("cors");

// Own modules
var EventSearch = require("facebook-events-by-location-core");

// Create the Express object
var app = express();

// Use morgan for logging
app.use(morgan("combined"));

// Set application properties
app.set("host", process.env.HOST || "0.0.0.0");
app.set("port", process.env.PORT0 || 3000);
app.set("x-powered-by", false);
app.set("etag", false);

// Instantiate CORS whitelist
var whitelist = [],
    enableAll = false;

// Check if FEBL_CORS_WHITELIST exists
if (process.env.FEBL_CORS_WHITELIST) {
    if (process.env.FEBL_CORS_WHITELIST.indexOf(",") > -1) {
        // Add custom whitelisted domains
        whitelist = whitelist.concat(process.env.FEBL_CORS_WHITELIST.split(","))
    } else {
        // Just push the FEBL_CORS_WHITELIST value
        whitelist.push(process.env.FEBL_CORS_WHITELIST);
    }
    // Log CORS whitelist
    console.log("Using CORS whitelist of " + whitelist);
// Otherwise enable all origins
} else {
    enableAll = true;
}

// CORS middleware handler
var corsOptions = {
    origin: function(origin, callback){
        if (whitelist.length > 0) {
            var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
            callback(null, originIsWhitelisted);
        } else if (enableAll) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }
};

// Main route
app.get("/events", cors(corsOptions), function(req, res) {

    if (!req.query.lat || !req.query.lng) {
        res.status(500).json({message: "Please specify the lat and lng parameters!"});
    } else if (!req.query.accessToken && !process.env.FEBL_ACCESS_TOKEN) {
        res.status(500).json({message: "Please specify an Access Token, either as environment variable odr as accessToken parameter!"});
    } else {

        var options = {};

        // Add latitude
        if (req.query.lat) {
            options.lat = req.query.lat;
        }
        if (req.query.lng) {
            options.lng = req.query.lng;
        }
        if (req.query.distance) {
            options.distance = req.query.distance;
        }
        if (req.query.accessToken) {
            options.accessToken = req.query.accessToken;
        } else {
            options.accessToken = process.env.FEBL_ACCESS_TOKEN || null;
        }
        if (req.query.query) {
            options.query = req.query.query;
        }
        if (req.query.sort) {
            options.sort = req.query.sort;
        }
        if (req.query.version) {
            options.version = req.query.version;
        }
        if (req.query.since) {
            options.since = req.query.since;
        }
        if (req.query.until) {
            options.until = req.query.until;
        }

        // Instantiate EventSearch
        var es = new EventSearch(options);

        // Search and handle results
        es.search().then(function (events) {
            res.json(events);
        }).catch(function (error) {
            res.status(500).json(error);
        });
        
    }

});

// Health check route
app.get("/health", function(req, res) {
    res.send("OK");
});

// Start Express.js server
var server = app.listen(app.get("port"), app.get("host"), function() {
    console.log("Express server listening on port " + server.address().port + " on " + server.address().address);
});
