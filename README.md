# Search Facebook events by location (as a service)
A Express.js-based webservice to get public Facebook events by location and distances, as well as search terms. It can be used as a starting point for an location-based app for example. 

## Motivation
As Facebook has discontinued the FQL query API for all apps created after 2014-04-30, it has gotten much more complicated to search for public Facebook events by location and distances. This is the reason why this project was created.

## Basics
The implementation of [facebook-events-by-location-core](https://github.com/tobilg/facebook-events-by-location-core), which is used for providing the Facebook events search functionality, uses regular Facebook Graph API calls in a three-step approach to get the events: 

1. Search for places in the radius of the passed coordinate and distance (`/search?type=place&q={query}&center={coordinate}&distance={distance}`)
2. Use the places to query for their events in parallel (`/?ids={id1},{id2},{id3},...`)
3. Unify, filter and sort the results from the parallel calls and return them to the client

## Known limitations

* The Graph API has some "instabilities" with search results. It's possible that the amount of results returned can vary between calls within seconds
* The `/search` endpoint "magically" limits the number of results, independent from the `distance` used (larger distance doesn't guarantee more results)
* [Rate limiting](https://developers.facebook.com/docs/graph-api/advanced/rate-limiting) will apply, but I experienced no call blocks within a reasonable amount of service requests. Be aware that the way this application works, there are potentially hundreds of (counted) Graph API calls per request to `/events`.

## Installation

### As NPM package

First, create a new folder: `$ mkdir fb-event-test` (where `fb-event-test` is just an example). 

Then change to the newly created directory, and do a quick initialization of your new project with `$ cd fb-event-test && npm init --yes`. 

The application can be installed via `$ npm install facebook-events-by-location` and started with `$ node node_modules/facebook-events-by-location/index.js`.

### Git
To clone the repository, use

`git clone https://github.com/tobilg/facebook-events-by-location.git`

and run `cd facebook-events-by-location && npm i && npm start` to install the dependencies and run the web service.

### As Docker microservice
You can build the Docker image via `docker build -t <yourTag> .` locally if you like. Also, there's an [official image](https://hub.docker.com/r/tobilg/facebook-event-search/) (called `tobilg/facebook-event-search`) in the Docker hub.
 
The service can be launched via Docker like this:

`docker run -d --name fb-event-search -p 3000:3000 tobilg/facebook-event-search`

This would expose the app on port 3000 on the Docker host. If you want to specify another port for the app, you can use `-e "PORT0=10000"` together with `--net="host"` (be aware of the security implications of host networking). 

## Environment variables
You can use the following environment variables to influence the application:

* `FEBL_ACCESS_TOKEN`: Used to define a general **App Access Token** to be used for the requests to the Graph API. This is overridden if the request specifies an `accessToken` parameter. If it's not specified, every request to `/events` needs to contain an `accessToken` parameter.
* `FEBL_CORS_WHITELIST`: You can pass a comma-separated domain whitelist to enable CORS headers (e.g. `http://www.test.com,http://www.test.org`). If you don't specify this variable, CORS will be enabled on all origins.
* `HOST`: The IP address the Express application should bind to. Default is `0.0.0.0` (all available IP addresses).
* `PORT0`: The port on which the application should run. Default is `3000`.

## API
The basic endpoint is `GET /events`, but there's also a `GET /health` endpoint to enable health checks.

### Query paramenters

Mandatory parameters are the following:

* `lat`: The latitude of the position/coordinate the events shall be returned for
* `lng`: The longitude of the position/coordinate the events shall be returned for

Non-mandatory parameters

* `query`: The term(s) on which you want to narrow down your *location search* (this only filters the places, not the events itself!).
* `categories`: The comma-separated list of [place categories](https://developers.facebook.com/docs/places/web/search#categories) that should be searched for. Valid entries are `ARTS_ENTERTAINMENT`, `EDUCATION`, `FITNESS_RECREATION`, `FOOD_BEVERAGE`, `HOTEL_LODGING`, `MEDICAL_HEALTH`, `SHOPPING_RETAIL`, `TRAVEL_TRANSPORTATION`. Default is none.  
* `accessToken`: The **App Access Token** to be used for the requests to the Graph API.
* `distance`: The distance in meters (it makes sense to use smaller distances, like max. 2500). Default is `100`.
* `sort`: The results can be sorted by `time`, `distance` (legacy option, will be removed in future release), `venueDistance`, `eventDistance`, `venue` or `popularity`. If omitted, the events will be returned in the order they were received from the Graph API.
* `version`: The version of the Graph API to use. Default is `v2.10`.
* `since`: The start of the range to filter results. Format is Unix timestamp or `strtotime` data value, as accepted by [FB Graph API](https://developers.facebook.com/docs/graph-api/using-graph-api#time).
* `until`: The end of the range to filter results.
* `showActiveOnly`: Whether to show only active (non-draft, non-cancalled Events). Default is `true`, otherwise `false` can be passed to show all Events regardless of their state. 

### Query results
The response will be `application/json` and contain an `events` property containing the array of event objects, as well as a `metadata` property with some stats. See below for an example.

#### Location/Place data in the query result

There are two types of locations in the resulting event JSON objects:

* `place`: This is the consolidated Place object from the Venue (which is actually the Page object which was returned from the Place search), and the Event's place data. The latter will supersede the Place page data.
* `venue.location`: This is the location data of the Page object.

As the Facebook Graph API can only be queried for Places via coordinate/distance, and Events can have their own, "real" location, it's possible that the place data which is found in `place` can be outside the boundaries of the original query. 

Consequences:
* If you want consistency regarding query vs. results, you should use `venue.location`. 
* If you want accuracy regarding the real event location, you should use `place`. 

### Sample call

`http://localhost:3000/events?lat=40.710803&lng=-73.964040&distance=100&sort=venue&accessToken=YOUR_APP_ACCESS_TOKEN` (make sure you replace `YOUR_APP_ACCESS_TOKEN` with a real access token!)

### Sample output (shortened)

```javascript
{
  "events": [{
    "id": "836655879846811",
    "name": "U.S. Girls at Baby's All Right",
    "type": "public",
    "coverPicture": "https://scontent.xx.fbcdn.net/v/t31.0-8/s720x720/24883312_1521878931228093_3223523563973203944_o.jpg?oh=9bc3e5c5d45e39c542b057b92df95243&oe=5AC0353F",
    "profilePicture": "https://scontent.xx.fbcdn.net/v/t1.0-0/c0.0.200.200/p200x200/24862268_1521878931228093_3223523563973203944_n.jpg?oh=23ec7dc943402ec7e0137f2d17f27719&oe=5AC246F8",
    "description": "Friday, April 13th @ Baby's All Right\n\nAdHoc Presents\n\nU.S. Girls\n\nTickets:  http://ticketf.ly/2j7AegO\n\n| Baby's All Right |\n146 Broadway @ Bedford Ave | Williamsburg, Brooklyn \nJMZ-Marcy, L-Bedford, G-Broadway | 8pm | $12 | 21+\n\nCheck out our calendar and sign up for our mailing list http://adhocpresents.com/",
    "distance": 89,
    "startTime": "2018-04-13T20:00:00-0400",
    "endTime": null,
    "timeFromNow": 9982924,
    "isCancelled": false,
    "isDraft": false,
    "category": "MUSIC_EVENT",
    "ticketing": {
      "ticket_uri": "http://ticketf.ly/2j7AegO"
    },
    "place": {
      "id": "460616340718401",
      "name": "Baby's All Right",
      "location": {
        "city": "Brooklyn",
        "country": "United States",
        "latitude": 40.71012,
        "longitude": -73.96348,
        "state": "NY",
        "street": "146 Broadway",
        "zip": "11211"
      }
    },
    "stats": {
      "attending": 20,
      "declined": 0,
      "maybe": 77,
      "noreply": 6
    },
    "distances": {
      "venue": 89,
      "event": 89
    },
    "venue": {
      "id": "460616340718401",
      "name": "Baby's All Right",
      "about": "babysallright@gmail.com",
      "emails": ["babysallright@gmail.com"],
      "coverPicture": "https://scontent.xx.fbcdn.net/v/t31.0-8/s720x720/20507438_1418517768261582_7945740169309872258_o.jpg?oh=24280a4732605e140c227db955c8d5e0&oe=5AC6B878",
      "profilePicture": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/1480734_642185745894792_5820988503650852577_n.png?oh=c6e72b8a5645644e7dd3eb3d2161329f&oe=5AC0CD2D",
      "category": "Bar",
      "categoryList": ["Bar", "Breakfast & Brunch Restaurant", "Dance & Night Club"],
      "location": {
        "city": "Brooklyn",
        "country": "United States",
        "latitude": 40.71012,
        "longitude": -73.96348,
        "state": "NY",
        "street": "146 Broadway",
        "zip": "11211"
      }
    }
  }],
  "metadata": {
    "venues": 100,
    "venuesWithEvents": 2,
    "events": 25
  }
}
```
