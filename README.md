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
The application can be installed via 

`npm install facebook-events-by-location`

in the root directory, and either started with 

`npm start` or `node index.js`.

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
* `accessToken`: The **App Access Token** to be used for the requests to the Graph API.
* `distance`: The distance in meters (it makes sense to use smaller distances, like max. 2500). Default is `100`.
* `sort`: The results can be sorted by `time`, `distance`, `venue` or `popularity`. If omitted, the events will be returned in the order they were received from the Graph API.
* `version`: The version of the Graph API to use. Default is `v2.7`.
* `since`: The start of the range to filter results. Format is Unix timestamp or `strtotime` data value, as accepted by [FB Graph API](https://developers.facebook.com/docs/graph-api/using-graph-api#time).
* `until`: The end of the range to filter results.

### Query results
The response will be `application/json` and contain an `events` property containing the array of event objects, as well as a `metadata` property with some stats. See below for an example.

### Sample call

`http://localhost:3000/events?lat=40.710803&lng=-73.964040&distance=100&sort=venue&accessToken=YOUR_APP_ACCESS_TOKEN` (make sure you replace `YOUR_APP_ACCESS_TOKEN` with a real access token!)

### Sample output (shortened)

```javascript
{
	"events": [{
        "id": "194204067750547",
        "name": "Jessica Hernandez & the Deltas at Baby's All Right",
        "type": "public",
        "coverPicture": "https://scontent.xx.fbcdn.net/v/t31.0-8/s720x720/17758407_10158752838305227_652819766277990370_o.jpg?oh=6f1076521abfe609f45c49f03b6ad3a7&oe=59978EB7",
        "profilePicture": "https://scontent.xx.fbcdn.net/v/t1.0-0/c50.0.200.200/p200x200/17796620_10158752838305227_652819766277990370_n.jpg?oh=b8fd07b35c4f227e4837465e3abe7963&oe=594D43B4",
        "description": "Tuesday June 13 @ Baby's All Right \n\nAdHoc Presents\n\nJessica Hernandez & The Deltas\n\nTIX: http://ticketf.ly/2oawOtz\n\n| Baby's All Right |\n146 Broadway @ Bedford Ave | Williamsburg, Brooklyn \nJMZ-Marcy, L-Bedford, G-Broadway | 7pm | $12+ | 18+\n\nSign up for the mailing list http://tinyurl.com/adhocfmlist\nSubscribe to our events http://facebook.com/adhocfm/events\n\nUpcoming AdHoc Shows\n\n04/13 Entrance (Guy Blakeslee), Ensalmo, Permanent Waves\n04/13 Kane West, Wharfwhit, Bruce Smear, Honnda\n04/14 Pharmakon (Record Release), Coteries, New Castrati\n04/15 Varsity, Fruit & Flowers, Petite League\n04/15 070Shake\n04/16 Lithics, Pucker Up, Bodega, Giggly Boys\n04/20 Helltrap Nightmare: the Hags Return\n04/20 The Coathangers \n04/21 The Coathangers\n04/22 Wolf Eyes (Record Release)\n04/22 Vatican Shadow\n04/23 Tonstartssbandht at The Park Church Co-op\n04/27 HAUX, Dizzy, Aisha Badru\n04/27 Sam Coffey & The Iron Lungs, Mikey Erg, The Othermen The Lame-Os\n04/27 Screaming Females\n04/28 Joakim, Starchild & The New Romantic\n04/28 Laser Background, Operator Music Band, Norwegian Arms, Railings\n04/29 White Lung\n05/02 Novelty Daughter, Elisa, Zenizen, Nicholas Nicholas\n05/03 The Revolution\n05/04 Emo Nite LA w/ special guests\n05/05 Omni, Honduras, Patio\n05/05 Ava Luna, Sammus, Mallrat\n05/05 Crushed (Record Release) w/ Sick Feeling, Neaux, Slashers\n05/05 Ava Luna, Sammus, Mall Rat\n05/05 Beanie Sigel, Manhattan Mal, Young Ros, Tim Wicked\n05/06 HOW SAD, Salt Cathedral\n05/06 Vagabon, Nnamdi Ogbonnaya, So Much Light\n05/07 Mega Bog, Tasseomancy\n05/09 Frank Carter & The Rattlesnakes, Dinosaur Pile-Up, Royal Republic\n05/09 Radkey\n05/09 Chastity at Shea Stadium\n05/09 Frank Carter & The Rattlesnakes, Dinosaur Pile-Up, Royal Republic\n05/10 Savoy Motel, Lionlimb\n05/10 Forest Swords, Actress, Umfang\n05/11 Tall Heights, Henry Jamison\n05/13 Alex Napping (Record Release), Pearer, gobbinjr, Long Neck\n05/13 Midnight Oil - SOLD OUT\n05/14 Midnight Oil\n05/14 Tall Juan (Record Release), Wild Yaks, Ben Katzman's Degreaser\n05/17 Sir Richard Bishop, Robert Millis at The Park Church Co-op\n05/18 Alex G \"Rocket\" Release Show at The Park Church Co-op – Sold Out\n05/18 Rex Orange County\n05/18 Highly Suspect\n05/19 Odwalla1221, Sadaf, Chicklette, Halfpet\n05/20 Adult Mom (Record Release) w/ B.B, Baby Grill\n05/20 Prawn, Mumblr, Wild Pink, Hard Pass\n05/20 Mumdance, Mr. Mitch, Shy Eyez\n05/20 Silent Servant, Not Waving, Pye Corner Audio, Via App\n05/24 Pixies - SOLD OUT\n05/24 Conan, North, False Gods\n05/25 The Walters, Palmas\n05/27 Elf Power, Sunwatchers\n05/27 Lil Debbie\n05/30 Pet Symmetry, Ratboys\n06/03 Chocolat, Bueno\n06/04 The Orbiting Human Circus featuring The Music Tapes\n06/06 Black Marble at Good Room\n06/08 Aldous Harding\n06/08 She-Devils\n06/08 Meatbodies\n06/08 Pelada, CL, Ciarra Black\n06/08 Elysia Crampton, Moor Mother, Total Freedom\n06/09 Girlpool, IAN Sweet, Lexie\n06/09 Mirah\n06/13 Jessica Hernandez & the Deltas\n06/14 Man Forever (Record Release)\n06/15 Sarah Shook & the Disarmers\n06/17 Orchin, Hellrazor, Model/Actriz, Maneka\n06/21 PWR BTTM, Tancred, Fits\n06/24 Julie Byrne at the Park Church Co-op\n07/11 Stolen Jars, Fraternal Twin, Thelma, Poppies\n07/27 Mark McGuire, Ancient Ocean",
        "distance": "89",
        "startTime": "2017-06-13T19:00:00-0400",
        "endTime": "2017-06-13T23:00:00-0400",
        "timeFromNow": 5302362,
        "category": "MUSIC_EVENT",
        "stats": {
            "attending": 3,
            "declined": 0,
            "maybe": 15,
            "noreply": 0
        },
        "venue": {
            "id": "460616340718401",
            "name": "Baby's All Right",
            "about": "babysallright@gmail.com",
            "emails": ["babysallright@gmail.com"],
            "coverPicture": "https://scontent.xx.fbcdn.net/v/t31.0-8/s720x720/16300274_1190598481053513_5678512810993788559_o.jpg?oh=dba6f85205e1c39c2b63ef34595116b3&oe=59587314",
            "profilePicture": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/1480734_642185745894792_5820988503650852577_n.png?oh=c1b2de32d966516538b97e2d3515af69&oe=5984652D",
            "category": "Dance & Night Club",
            "category_list": ["Dance & Night Club", "Breakfast & Brunch Restaurant"],
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
		"venues": 1,
		"venuesWithEvents": 1,
		"events": 4
	}
}
```