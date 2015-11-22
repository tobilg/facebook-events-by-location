# Search Facebook events by location (as a service)
A Express.js-based webservice to get public Facebook events by location. It can be used as a starting point for an location-based app for example.

As Facebook has discontinued the FQL query API for all apps created after 2014-04-30, it has gotten much more complicated to get public Facebook events by passing a location.

This implementation uses regular Facebook Graph API calls in a three-step approach to get the events:

1. Search for places in the radius of the passed coordinate and distance (`/search?type=place&q=*&center={coordinate}&distance={distance}`)
2. Use the places to query for their events in parallel (`/?ids={id1},{id2},{id3},...`)
3. Unify, filter and sort the results from the parallel calls and return them to the client

###Known limitations

* The Graph API has some "instabilities" with search results. It's possible that the amount of results returned can vary between calls within seconds 
* Undocumented usage of the `q` parameter (`q=*` produced more results than `q=` or just omitting the `q` parameter)
* The `/search` endpoint "magically" limits the number of results, independent from the `distance` used (larger distance doesn't guarantee more results)

##Installation
The application can be installed via

`npm install`

in the root directory, and either started with 

`npm start` or `node app.js`.

##API
The basic endpoint is `/events`, the port of the application can be set via environment variable.

###Query paramenters
Mandatory parameters are the following:

* `lat`: The latitude of the position/coordinate the events shall be returned for
* `lng`: The longitude of the position/coordinate the events shall be returned for
* `distance`: The distance in meters (it makes sense to use smaller distances, like max. 2500)
* `access_token`: The **App Access Token** to be used for the requests to the Graph API

Non-mandatory parameters

* `sort`: The results can be sorted by `time`, `distance` or `venue`. If omitted, the events will be returned in the order they were received from the Graph API

###Query results
The response will be `application/json` and contain an `events` property containing the array of event objects, as well as a `metadata` property with some stats. See below for an example.

###Sample call

`http://localhost:3000/events?lat=40.710803&lng=-73.964040&distance=1000&sort=venue&access_token=YOUR_APP_ACCESS_TOKEN` (make sure you replace `YOUR_APP_ACCESS_TOKEN` with a real access token!)

###Sample output (shortened)

```
{
    "events": [
        {
            "venueId": "460616340718401",
            "venueName": "Baby's All Right",
            "venueCoverPicture": "https://scontent.xx.fbcdn.net/hphotos-xfa1/t31.0-8/s720x720/12265652_847575375355827_6601509754180711535_o.jpg",
            "venueProfilePicture": "https://scontent.xx.fbcdn.net/hprofile-xft1/v/t1.0-1/p200x200/1480734_642185745894792_5820988503650852577_n.png?oh=fc70de542d587b32e7a8a9183ddb0560&oe=56E4082D",
            "venueLocation": {
                "city": "Brooklyn",
                "country": "United States",
                "latitude": 40.70998,
                "longitude": -73.9634705,
                "state": "NY",
                "street": "146 Broadway",
                "zip": "11211"
            },
            "eventId": "1671296009750385",
            "eventName": "Baby's All Basel | Dec 2 - 6 | Baby's All Right Miami Pop Up",
            "eventCoverPicture": "https://scontent.xx.fbcdn.net/hphotos-xpa1/v/t1.0-9/s720x720/12249784_1002625069800744_6143497234204516409_n.png?oh=6e5b3eaa2a369d819d160560173cdbea&oe=56E61E88",
            "eventProfilePicture": "https://scontent.xx.fbcdn.net/hphotos-xpa1/v/t1.0-0/c120.0.200.200/p200x200/12249784_1002625069800744_6143497234204516409_n.png?oh=9bc7c7dcd65934ab74010a890d9ac070&oe=56F5E8D3",
            "eventDescription": "POPLIFE Presents:\n\nBABY'S ALL BASEL\n\nBrooklyn's Baby's All Right is touching down in Miami for a week full of live music & parties!\n\nGet involved in all the fun:\nhttp://epop.life/BabysMiami\n\n21+ \n\n#BabysMiami",
            "eventStarttime": "2015-12-02T17:00:00-0800",
            "eventDistance": "103",
            "eventTimeFromNow": 884065,
            "eventStats": {
                "attendingCount": 143,
                "declinedCount": 0,
                "maybeCount": 96,
                "noreplyCount": 1117
            }
        },
        ...
    ],
    "metadata": {
        "venues": 350,
        "venuesWithEvents": 7,
        "events": 23
    }
}
```