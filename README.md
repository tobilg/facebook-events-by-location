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
The response will be `application/json` and contain an `events` property contain the array of event objects, as well as a `metadata` property with some stats. See below for an example.

###Sample call

`http://localhost:3000/events?lat=40.710803&lng=-73.964040&distance=1000&sort=venue&access_token=YOUR_APP_ACCESS_TOKEN` (make sure you replace `YOUR_APP_ACCESS_TOKEN` with a real access token!)

###Sample output (shortened)

```
{
    "events": [
        {
            "venueId": "779826698797907",
            "venueName": "El Puente Presente",
            "venueLocation": {
                "city": "Brooklyn",
                "country": "United States",
                "latitude": 40.7109299,
                "longitude": -73.9595032,
                "state": "NY",
                "street": "211 South 4th St",
                "zip": "11211"
            },
            "eventId": "1491929741120777",
            "eventName": "Southside Connex & ¡WEPA! Festival",
            "eventDescription": "All programming for Southside Connex is FREE and open to all ages!\n\nSATURDAY SEPTEMBER 19th\n1:00PM Mariachi Tapatio de Alvaro Paulino\n1:40PM El Puente Dance Ensemble\n1:55PM The Peace Poets\n2:10PM El Puente Dreams in Motion\n2:30PM Contestoria Street Theatre Performance by El Puente CADRE and AgitArte\n3:20PM BombaYo\n4:10PM Formula 4 Merengue Tipico\n5:15PM Los Hacheros Salsa Band\n+ skully games, book talks, corridos de bomba, photo booth and more!\n\nSATURDAY SEPTEMBER 26th\n2-6PM Domino tournament \n1-5PM Yoga classes\n2-6PM Essential oil therapy\n1-6PM Dance classes: bomba, tribal dance, zumba, belly dance, salsa\n2&4PM Puppet show\n+ mediation and stress management, martial arts, DJ, button-making and more!\n\nSouthside Connex is an annual two-day community street festival in Los Sures (Southside of Williamsburg) produced by El Puente Green Light District in collaboration with Southside Merchants and the Brooklyn Chamber of Commerce/Brooklyn Alliance. In conjunction with NYC Department of Transportation’s Weekend Walks program, on September 19th and 26th, 1-6PM, Havemeyer Street between Grand Street and South 4th Street will be closed to vehicle traffic and filled with cultural activities, health and wellness workshops, environmental justice information & resources, and El Puente’s annual ¡WEPA! Festival for Southside Performing Arts on September 19th.",
            "eventStarttime": "2015-09-19T13:00:00-0400",
            "eventDistance": "383",
            "eventTimeFromNow": 277780,
            "eventStats": {
                "attendingCount": 93,
                "declinedCount": 30,
                "maybeCount": 23,
                "noreplyCount": 805
            }
        },
        {
            "venueId": "163102043741893",
            "venueName": "Magic Bus USA",
            "venueLocation": {
                "city": "Brooklyn",
                "country": "United States",
                "latitude": 40.7167664,
                "longitude": -73.9657288,
                "state": "NY",
                "street": "240 Kent Avenue",
                "zip": "11249"
            },
            "eventId": "939785132750501",
            "eventName": "Magic Bus USA | 2015 Benefit Gala - Houston",
            "eventDescription": "Help break the poverty cycle ONE CHILD at a time!\n\nYou are cordially invited to attend the Magic Bus USA | 2015 Benefit Gala. \n\nAn evening of cocktails, dinner, and Magic hosted by:\n- Amit Bhandari \n- Brij Kathuria \n- Gopal Savjani \n- Dr. HD Patel \n- Jugal Malani \n- Mona Parikh \n- Dr. Sunita Moonat \n- Swatantra Jain \n\nTo sponsor or reserve a table, please contact Houston@magicbususa.org\n\nFor tickets, please visit https://magicbususa.givezooks.com/events/2nd-annual-magic-bus-benefit-dinner",
            "eventStarttime": "2015-09-19T18:00:00-0500",
            "eventDistance": "678",
            "eventTimeFromNow": 299380,
            "eventStats": {
                "attendingCount": 15,
                "declinedCount": 19,
                "maybeCount": 7,
                "noreplyCount": 149
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