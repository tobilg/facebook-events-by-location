var express = require('express');
var router = express.Router();
var Promise = require("bluebird");
var rp = require('request-promise');

function calculateStarttimeDifference(currentTime, dataString) {
  return (new Date(dataString).getTime()-(currentTime*1000))/1000;
}

function compareVenue(a,b) {
  if (a.venueName < b.venueName)
    return -1;
  if (a.venueName > b.venueName)
    return 1;
  return 0;
}

function compareTimeFromNow(a,b) {
  if (a.eventTimeFromNow < b.eventTimeFromNow)
    return -1;
  if (a.eventTimeFromNow > b.eventTimeFromNow)
    return 1;
  return 0;
}

function compareDistance(a,b) {
  if (a.eventDistance < b.eventDistance)
    return -1;
  if (a.eventDistance > b.eventDistance)
    return 1;
  return 0;
}

function haversineDistance(coords1, coords2, isMiles) {

  //coordinate is [latitude, longitude]
  function toRad(x) {
    return x * Math.PI / 180;
  }

  var lon1 = coords1[1];
  var lat1 = coords1[0];

  var lon2 = coords2[1];
  var lat2 = coords2[0];

  var R = 6371; // km

  var x1 = lat2 - lat1;
  var dLat = toRad(x1);
  var x2 = lon2 - lon1;
  var dLon = toRad(x2)
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  if(isMiles) d /= 1.60934;

  return d;
}

router.get('/events', function(req, res, next) {

  if (!req.query.lat || !req.query.lng || !req.query.distance || !req.query.access_token) {
    res.status(500).send({error: "Please specify the lat, lng, distance and access_token query parameters"});
  } else {

    var idLimit = 50, //FB only allows 50 ids per /?ids= call
        currentTimestamp = (new Date().getTime()/1000).toFixed(),
        venuesCount = 0,
        venuesWithEvents = 0,
        eventsCount = 0,
        placeUrl = "https://graph.facebook.com/v2.4/search?type=place&q=*&center=" + req.query.lat + "," + req.query.lng + "&distance=" + req.query.distance + "&limit=1000&fields=id&access_token=" + req.query.access_token;

    //Get places as specified
    rp.get(placeUrl).then(function(responseBody) {

      var ids = [],
          tempArray = [],
          data = JSON.parse(responseBody).data;

      //Set venueCount
      venuesCount = data.length;

      //Create array of 50 places each
      data.forEach(function(idObj, index, arr) {
        if (tempArray.length < idLimit) {
          tempArray.push(idObj.id);
        } else {
          ids.push(tempArray);
          tempArray = [];
        }
      });

      return ids;
    }).then(function(ids) {

      var urls = [];

      //Create a Graph API request array (promisified)
      ids.forEach(function(idArray, index, arr) {
        urls.push(rp.get("https://graph.facebook.com/v2.4/?ids=" + idArray.join(",") + "&fields=id,name,cover.fields(id,source),picture,location,events.fields(id,name,cover.fields(id,source),description,start_time,attending_count,declined_count,maybe_count,noreply_count).since(" + currentTimestamp + ")&access_token=" + req.query.access_token));
      });

      return urls;

    }).then(function(promisifiedRequests) {

      //Run Graph API requests in parallel
      return Promise.all(promisifiedRequests)

    })
    .then(function(results){

      var events = [];

      //Handle results
      results.forEach(function(resStr, index, arr) {
        var resObj = JSON.parse(resStr);
        Object.getOwnPropertyNames(resObj).forEach(function(venueId, index, array) {
          var venue = resObj[venueId];
          if (venue.events && venue.events.data.length > 0) {
            venuesWithEvents++;
            venue.events.data.forEach(function(event, index, array) {
              var eventResultObj = {};
              eventResultObj.venueId = venueId;
              eventResultObj.venueName = venue.name;
              eventResultObj.cover = venue.cover;
              eventResultObj.venueLocation = venue.location;
              eventResultObj.eventId = event.id;
              eventResultObj.eventName = event.name;
              eventResultObj.eventDescription = event.description;
              eventResultObj.eventStarttime = event.start_time;
              eventResultObj.eventDistance = (haversineDistance([venue.location.latitude, venue.location.longitude], [req.query.lat, req.query.lng], false)*1000).toFixed();
              eventResultObj.eventTimeFromNow = calculateStarttimeDifference(currentTimestamp, event.start_time);
              eventResultObj.eventStats = {
                attendingCount: event.attending_count,
                declinedCount: event.declined_count,
                maybeCount: event.maybe_count,
                noreplyCount: event.noreply_count
              }
              events.push(eventResultObj);
              eventsCount++;
            });
          }
        });
      });

      //Sort if requested
      if (req.query.sort && (req.query.sort.toLowerCase() === "time" || req.query.sort.toLowerCase() === "distance" || req.query.sort.toLowerCase() === "venue")) {
        if (req.query.sort.toLowerCase() === "time") {
          events.sort(compareTimeFromNow);
        }
        if (req.query.sort.toLowerCase() === "distance") {
          events.sort(compareDistance);
        }
        if (req.query.sort.toLowerCase() === "venue") {
          events.sort(compareVenue);
        }
      }

      //Produce result object
      res.send({events: events, metadata: {venues: venuesCount, venuesWithEvents: venuesWithEvents, events: eventsCount}});

    }).catch(function (e) {
      res.status(500).send({error: e});
    });
  }

});

module.exports = router;
