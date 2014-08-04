
// check for geolocation support
var GEOLOCATION_SUPPORTED = (navigator.geolocation),
    getCurrentPosition = navigator.geolocation.getCurrentPosition;

var config = {
    mapId: 'map-canvas',
    mapOptions: {
        center: new LatLng(37.09024, -95.71289100000001),
        zoom: 4
    }
}

var ZanesHouse = new LatLng(45.491219, -122.652799),
    MyHouse = new LatLng(45.660769, -121.543969)

$(document).ready(function () {

    var myFreeboxFinder = new FreeboxFinder(config)

});


function getLocation () {

    // get the current position
    navigator.geolocation.getCurrentPosition(getCurrentPositionResults, getCurrentPositionError);

}

function getCurrentPositionResults (position) {
            
    console.log('position', position);

    getGeocodedLocation(position.coords.latitude, position.coords.longitude)
}

function getCurrentPositionError(error) {

    var location = document.getElementById('location'),
        msg;

    switch(error.code) {
        case error.PERMISSION_DENIED:
            var msg = 'User denied the request for Geolocation.'
            break;
        case error.POSITION_UNAVAILABLE:
            var msg = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            var msg = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            var msg = "An unknown error occurred."
            break;
    }

    $('#current-location .container').replaceWith("<div class='container'>" + msg + " </div>")
    console.log(msg)
            
}

function getGeocodedLocation () {

    var args = Array.prototype.slice.call(arguments, 0),
        geocodeOptions = {},
        pieces

    // if string representation of coordinates is given:
    if (coordinateRexExp.test(args[0])) {
        geocodeOptions.location = args[0];
    }

    // if lat and lng were provided as separate parameters
    else if (coordinateRexExp.test(args.join(', '))) {
        geocodeOptions.location = new LatLng(args[0], args[1]);

    // or if a string location is provided
    } else {
        geocodeOptions.address = args[0]
    }

    console.log('geocodeOptions', geocodeOptions)
   
    if (myGeocoder) {
        myGeocoder.geocode(geocodeOptions, geocodeResults);
    }

}

function geocodeResults (results, status) {

    if (status == google.maps.GeocoderStatus.OK) {

        var result = results[0]

        var newLocation = result.geometry.viewport.getCenter(),
        lat = newLocation.k,
        lng = newLocation.B;

        console.log('newLocation', newLocation)

        setLocation(lat, lng)

        updateMap(result)

    } else {
        console.log('status', status)
    }
}

function setLocation (lat, lng) {

    currentLatLng = new LatLng(lat, lng);

    console.log('currentLatLng', currentLatLng)

    newLocationCoords = "<div class='container'>Latitude: " + lat
            + ", Longitude: " + lng + "</div>";

    console.log('newLocationCoords', newLocationCoords)
    
    $('#current-location .container').replaceWith(newLocationCoords)

    // socket.emit('new-location', )
}




//
// utilities
//

var BYTE = 1,
    KB = 1024 * BYTE,
    MB = 1024 * KB,
    GB = 1024 * MB,
    TB = 1024 * GB,
    PB = 1024 * TB;

var MILLISECOND = 1,
    SECOND = 1000 * MILLISECOND,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
    MONTH = 30 * DAY,
    YEAR = 365 * DAY;

// 
// "This one will strictly match latitude and longitude values that fall within the correct range:"
// ...
// Matches
// 
// +90.0, -127.554334 45, 180
// -90, -180
// -90.000, -180.0000
// +90, +180
// 47.1231231, 179.99999999
// Doesn't Match
// 
// -90., -180.
// +90.1, -100.111
// -91, 123.456
// 045, 180
// 
// @see: http://stackoverflow.com/a/18690202/1690165
// 
var coordinateRexExp = new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/)

// @see - http://killdream.github.io/blog/2011/10/understanding-javascript-oop/index.html

// Aliases for the rather verbose methods on ES5
var descriptor  = Object.getOwnPropertyDescriptor, 
    properties  = Object.getOwnPropertyNames, 
    define_prop = Object.defineProperty;

function clone(parent) {
    var cloned = {};
    properties(parent).forEach(function(key) {
        define_prop(cloned, key, descriptor(parent, key)) 
    });

    return cloned;
};

function extend(original, extensions) {       

    original = original || {};
    extensions = extensions || {};

    properties(extensions).forEach(function(key) {
        define_prop(original, key, descriptor(extensions, key)) 
    });

    return original;
};

function getType (obj) {
    return (isNaN(obj)) ? 'NaN' : ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

// returns that to which an XOR expression would evaluate
function XOR (a,b) {
  return ( a || b ) && !( a && b );
};
