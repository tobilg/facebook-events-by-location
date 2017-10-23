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
* `sort`: The results can be sorted by `time`, `distance`, `venue` or `popularity`. If omitted, the events will be returned in the order they were received from the Graph API.
* `version`: The version of the Graph API to use. Default is `v2.7`.
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
		"id": "116647332331110",
		"name": "Prawn, Slingshot Dakota, People Like You, Queen Moo",
		"type": "public",
		"coverPicture": "https://scontent.xx.fbcdn.net/v/t1.0-9/s720x720/21192424_1427554070660580_9176354166665292778_n.jpg?oh=ec701dee3019485d44779c978c2af3d2&oe=5A5EB0B5",
		"profilePicture": "https://scontent.xx.fbcdn.net/v/t1.0-0/c163.0.200.200/p200x200/21192424_1427554070660580_9176354166665292778_n.jpg?oh=547d3ff8933c6987bcad8530558ca909&oe=5A2318A9",
		"description": "Friday Dec 22nd @ Baby's All Right\n\nAdHoc Presents\n\nPrawn\nSlingshot Dakota\nPeople Like You\nQueen Moo\n\nTix, on-sale Wed 8/30 at 10am: http://ticketf.ly/2vwM2tV\n\n| Baby's All Right |\n146 Broadway @ Bedford Ave | Williamsburg, Brooklyn \nJMZ-Marcy, L-Bedford, G-Broadway | 7pm | $12+ | 18+\n\nSign up for the mailing list http://tinyurl.com/adhocfmlist\nSubscribe to our events http://facebook.com/adhocfm/events\n\nUpcoming AdHoc Shows\n\n08/28 Sound of Ceres (Residency), Kate Brehm - The Poof - Visual Performance, Foxes in Fiction\n09/01 Twerps, Free Time, Lionlimb\n09/02 White Hills, Spaceface, New Myths\n09/02 Crumb, Combo Chimbita, MIKE\n09/02 CRi, Rei Brown\n09/05 Dinner, Obliques, Nicholas Nicholas\n09/06 Laetitia Sadier Source Ensemble, Nicholas Krgovich, Astrobal\n09/06 Cende, Poppies, Anna McClellan, Spirit Was\n09/07 Remo Drive, McCafferty, Small Circle\n09/07 Rachel Baiman\n09/07 The Amazing Acro-Cats\n09/08 Four Year Strong, Seaway, Like Pacific, Grayscale, Life Lessons\n09/08 The Smith Street Band, Astronautalis\n09/08 Starcrawler, Honduras, Easy\n09/08 Dent May, Gemma\n09/08 Sextile, Surfbort, Black Beach\n09/08 Moon King, Dougie Poole, House of Feelings (live)\n09/08 The Amazing Acro-Cats\n09/09 The Amazing Acro-Cats\n09/09 The Amazing Acro-Cats\n09/09 Cones, Cassandra Jenkins, Dark Tea\n09/09 Four Year Strong, Seaway, Like Pacific, Grayscale, Life Lessons\n09/09 Chris Cohen, Cut Worms, Olden Yolk\n09/09 OctFest (Guided by Voices, Charles Bradley, Kilo Kish, Okkervil River)\n09/10 The Amazing Acro-Cats\n09/10 The Amazing Acro-Cats\n09/11 Mount Eerie\n09/12 Mount Eerie, Loren Connors\n09/12 Beverly, EZTV, Rips\n09/12 NOTS, Honey, Brandy\n09/12 Half Waif, Squad Car, Abandon, Coolin'\n09/13 Night Shop, Jaye Bartell\n09/13 Dear Nora, gobbinjr, Nicholas Krgovich\n09/13 Protomartyr, Pill, Bodega\n09/14 Sitcom, Jennifer Vanilla, Field Medic, DÆVA\n09/14 Blood Cultures, White Cliffs, Gus Dapperton\n09/15 Teen Commandments, Brothertiger\n09/15 Varsity, Hypoluxo, Thanks for Coming, Human People\n09/15 Throwing Snow, BAILE\n09/16 Steve Gunn, Julie Byrne, Myriam Gendron\n09/17 Ancient Ocean, Dave Harrington, Colin L, Adam Downey (DJ)\n09/19 GOLD DIME, Crown Larks, GDFX, Baby Birds Don't Drink Milk\n09/19 Madeline Kenney, Tall Friend, Trees Take Ease\n09/21 Cold Beat, War Bubble, Liberation\n09/22 Human Heat, Norwegian Arms\n09/22 Aerial East, Lola Kirke\n09/23 Love Theme, Bernardino Femminielli\n09/23 Hovvdy, Told Slant, Yohuna\n09/23 Drab Majesty, Kontravoid, Bernard Herman\n09/23 Cayetana, Hemming\n09/23 Flesh World, Home Blitz\n09/23 Xiu Xiu, Noveller, Re-TROS\n09/24 Painted Zeros, Slow Mass, Stove (solo), Bethlehem Steel\n09/27 Lina Tullgren (Release Show), Dougie Poole, Luxardo\n09/27 VNV Nation, iVardensphere – Sold Out\n09/27 Ian Chang (Record Release), Rahm, Nina Moffitt\n09/28 Container, Paleda, Young Male (DJ), Motiv-A, VIA APP (DJ)\n09/29 Princess Nokia\n09/29 Stolen Jars, Zula, Diners, Real Life Buildings\n09/29 Candi Pop\n10/02 Illegal Civ Cinema Tour Featuring: Denzel Curry & Show Me The Body, Show Me The Body\n10/05 The Babe Rainbow\n10/06 Paperhaus, Haybaby, Turnip King, Sic Tic\n10/06 Mirah, Jherek Bischoff\n10/06 LVL UP, Yowler, Slight\n10/06 Twinsmith\n10/06 The Golden Filter\n10/07 Frankie Cosmos, Ian Sweet, Nice Try\n10/07 The Proper Ornaments, Shadow Band, Kyle Forester\n10/07 Vetiver, Johnny Irion\n10/07 Deerhoof, Lily On Horn Horse\n10/07 LVL UP, Long Beard, Yucky Duster\n10/08 The Wonder Years, Laura Stevenson - Matinee Show\n10/08 The Wonder Years, Laura Stevenson, The Obsessives, Jetty Bones\n10/09 Naomi Punk, Shimmer, Lea Bertucci\n10/11 Sun Seeker\n10/12 Lust For Youth, Secret Boyfriend, Cienfuegos\n10/12 Adi Newton, James Place, Embryoroom\n10/13 Wolves In The Throne Room, Pillorian\n10/13 Skylar Spence, Jonah Baseball\n10/13 DJ Earl, Slick Shoota, Suzi Analogue, Mel G\n10/14 William Patrick Corgan\n10/15 William Patrick Corgan\n10/15 The Courtneys, Versing\n10/17 Dead Rider, Eaters, Christina Schneider's Genius Grant\n10/18 Grails\n10/19 Vita and The Woolf, Queen Of Jeans\n10/20 Alex Calder, Jay Weingarten, Sam Leidig\n10/20 Melkbelly, Anni Rossi, Maneka, Blue Smiley\n10/21 Scharpling & Wurster’s ‘Rock, Rot & Rule’ 20th Anniversary Extravaganza\n10/21 Sheer Mag\n10/23 Insane Clown Posse\n10/25 PUJOL\n10/26 Mild High Club, Anemone, Olden Yolk\n10/26 Walter TV\n10/26 Dälek, Street Sects, Vaureen\n10/27 Microwave, Big Jesus, Blis.\n10/27 Florist, Emily Yacina, Lizard Kisses\n10/27 Trevor Sensor\n10/27 Boy Harsher (Record Release), FlucT, Odonis Odonis\n10/28 Peelander-Z\n11/02 The Hotelier, Oso Oso, Alex Napping\n11/03 L.A. Witch\n11/03 AJJ, The Sidekicks\n11/03 J.Views, Ateller\n11/04 Ought\n11/04 Elysia Crampton, Earthly\n11/06 Cattle Decapitation, Revocation, Full of Hell, Artificial Brain\n11/09 Have Mercy, Boston Manor, Can't Swim, A Will Away\n11/11 Wax Tailor, Dirty Art Club\n11/11 A. Savage (Parquet Courts), Jack Cooper (Ultimate Painting)\n11/12 Listener, Levi The Poet, Comrades, Everett\n11/13 Omni\n11/16 Haux w/ Strings\n11/17 Downtown Boys, Olivia Neutron-John\n11/24 mewithoutYou, Pianos Become The Teeth, Slow Mass\n11/28 Lido Beach\n11/30 Emily Haines & The Soft Skeleton\n12/01 Neil Hilborn\n12/06 Pinegrove, Saintseneca, Adult Mom – Sold Out\n12/07 Pinegrove, Saintseneca, Adult Mom – Sold Out\n12/08 Gabriel Garzón-Montano",
		"distance": "89",
		"startTime": "2017-12-22T19:00:00-0500",
		"endTime": null,
		"timeFromNow": 9468080,
		"isDraft": false,
		"isCancelled": false,
		"category": "MUSIC_EVENT",
		"ticketing": {
			"ticket_uri": "http://ticketf.ly/2wVV87f"
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
			"attending": 38,
			"declined": 0,
			"maybe": 151,
			"noreply": 21
		},
		"venue": {
			"id": "460616340718401",
			"name": "Baby's All Right",
			"about": "babysallright@gmail.com",
			"emails": ["babysallright@gmail.com"],
			"coverPicture": "https://scontent.xx.fbcdn.net/v/t31.0-8/s720x720/20507438_1418517768261582_7945740169309872258_o.jpg?oh=cee452a92068d3011c319c9d1bef63d0&oe=5A501178",
			"profilePicture": "https://scontent.xx.fbcdn.net/v/t1.0-1/p200x200/1480734_642185745894792_5820988503650852577_n.png?oh=115d8c043d25e71635906461044539b5&oe=5A22992D",
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
		"venues": 1,
		"venuesWithEvents": 1,
		"events": 4
	}
}
```
