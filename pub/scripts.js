
var config = {
    center: new google.maps.LatLng(39.794735, -101.377890),
    mapId: 'map-canvas',
    zoom: 4
}

var Geocoder = google.maps.Geocoder;
    InfoWindow = google.maps.InfoWindow,
    LatLng = google.maps.LatLng,
    Map = google.maps.Map,
    Marker = google.maps.Marker
    
var currentLatLng,
    myMap,
    myGeocoder = new Geocoder(),
    socket

var cache = {
    boxes : [],
    markers : [],
    infoWindows : []
};

var ZanesHouse = new LatLng(45.491219, -122.652799),
    MyHouse = new LatLng(45.660769, -121.543969)


$(document).ready(function () {
    myMap = new Map(document.getElementById('map-canvas'), { center: config.center, zoom: config.zoom });
    console.log('myMap', myMap);

    socket = io();

    socket.on('connect', socketConnect)

    socket.on('boxes', socketBoxes)

    socket.on('new-box', socketNewBox)

});

function socketConnect () {

    $('#set-location-now').click(function setLocation () {
        console.log('set location now!')

        var newLocation = $('#new-location').val();
        console.log('newLocation', newLocation)

        getGeocodedLocation(newLocation);

    });

    $('#search-tags').click(function searchTags () { 
        console.log('search tags!');

        getGeocodedLocation(currentLatLng.lat(), currentLatLng.lng())
    });

    $('#newBox').click(function newBox () {

        var query = {
            street1: $('#box-street1').val(),
            street2: $('#box-street2').val(),
            city: $('#box-city').val(),
            state: $('#box-state').val(),
            zip: $('#box-zip').val(),
            tags: $('#tags').val()
        };

        // console.log(query)

        // socket.emit('get-boxes', );
    });

    getLocation();

}

function socketBoxes (boxes) {
    // remove the old markers from the map
    cache.markers.forEach(function (marker) {
        // remove from map by passing setMap a null parameter
        marker.setMap(null)
        // delete the marker, we'll make it agin if the box still exists
        delete marker;
    });

    console.log('cache.markers', cache.markers)

    boxes.forEach(addBoxToMap)
}

function socketNewBox (box) {
    cache.boxes.push(box);

    addBoxToMap(box);
};

function getLocation () {

    // check for navigator
    if (navigator.geolocation) {
        console.log('navigator supported!');

        // get the current position
        navigator.geolocation.getCurrentPosition(getCurrentPositionResults, getCurrentPositionError);

    } else {
        console.log('navigator NOT supported!');
    }
}

function getCurrentPositionResults (position) {
            
    console.log('position', position);

    newLocationCoords = "<div class='container'>Latitude: " + position.coords.latitude
            + ", Longitude: " + position.coords.longitude 
            + " (accurate to " + position.coords.accuracy + "')</div>";

    console.log('newLocationCoords', newLocationCoords)
    
    $('#current-location .container').replaceWith(newLocationCoords)

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
        pieces = (getType(args[0]) === 'array') ? args[0].split(',') : null;

    args.forEach(function (arg, index) {
        args[index] = parseFloat(arg);
    })

    // if lat and lng are provided as separate params
    if (typeof(args[0] === 'number' && typeof(args[1] === 'number'))) {
        currentLatLng = new LatLng(args[0], args[1]);
        geocodeOptions.location = currentLatLng
    // or if they are provided as a string formatted 'lat, long'
    } else if (pieces) {
        pieces.forEach(function (piece, index) {
            pieces[index] = parseFloat(piece)
        });

        if (typeof(pieces[0]) === 'number' && typeof( pieces[1]) === 'number') {
            geocodeOptions.location = new LatLng(pieces[0], pieces[1])
        } else {

        }
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

        var component,
            result = 0;

        console.log('results[' + result + ']', results[result])

        updateMap(results[result]) 
    } else {
        console.log('status', status)
    }
}

function updateMap (result) {
    console.log('viewport', result.geometry.viewport)

    myMap.fitBounds(result.geometry.viewport);
    myMap.setZoom(getBoundsZoomLevel(result.geometry.viewport))

    var splitAddress = result.formatted_address.split(', '),
        tags = [];

    $('#tags')
        .val()
        .split(', ')
        .forEach(function(piece) {

            if (piece || piece !== '') {
                console.log('piece', piece)
                tags.push(piece.trim())
            }
        });

    console.log('tags', tags)

    socket.emit('get-boxes', {
        city: splitAddress[1],
        state: splitAddress[2].split(' ')[0],
        zip: splitAddress[2].split(' ')[1],
        tags: tags
    });

    function getBoundsZoomLevel(bounds) {
        var mapDim = {
            height: $('#map-canvas').height(),
            width: $('#map-canvas').width()
        }

        var WORLD_DIM = { height: 256, width: 256 };
        var ZOOM_MAX = 21;

        function latRad(lat) {
            var sin = Math.sin(lat * Math.PI / 180);
            var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
            return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
        }

        function zoom(mapPx, worldPx, fraction) {
            return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
        }

        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();

        var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;
        
        var lngDiff = ne.lng() - sw.lng();
        var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;
        
        var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
        var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

        return Math.min(latZoom, lngZoom, ZOOM_MAX);
    }

}

function addBoxToMap (box) {

    var marker,
        markerOptions,
        infoWindow,
        infoWindowOptions

    markerOptions =  box
    markerOptions.animation = google.maps.Animation.DROP

    marker = new Marker(markerOptions)

    cache.markers.push(marker);

    infoWindowOptions = { 
        content: box.content,
        position: box.position
    };

    infoWindow = new InfoWindow(infoWindowOptions);

    cache.infoWindows.push(infoWindow);

    infoWindow.open(myMap, marker);

    console.log('cache', cache)
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