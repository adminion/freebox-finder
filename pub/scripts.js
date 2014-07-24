
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
    
var myMap,
    myGeocoder = new Geocoder(),
    socket

var cache = {
    markers : [],
    infoWindows : []
};

var ZanesHouse = new LatLng(45.491219, -122.652799),
    MyHouse = new LatLng(45.660769, -121.543969)


$(document).ready(function () {
    socket = io();

    socket.on('connect', socketConnect )

});

function socketConnect () {

    getLocation();

}

function getLocation () {
    myMap = new Map(document.getElementById('map-canvas'), { center: config.center, zoom: config.zoom });
    console.log('myMap', myMap);

    // check for navigator

    if (navigator.geolocation) {

        console.log('navigator supported!');
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

    getGeocodedLocation(position)
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

function getGeocodedLocation (position) {

    var currentLatLng = new LatLng(position.coords.latitude, position.coords.longitude);
    console.log('currentLatLng', currentLatLng)
   
    if (myGeocoder) {
        myGeocoder.geocode(currentLatLng, geocodeResults);
    }

}

function geocodeResults (results, status) {

    if (status == google.maps.GeocoderStatus.OK) {

        console.log('results[' + result + ']', results[result])

        updateMap(results[0]) 
    } else {
        console.log('status', status)
    }
}

function updateMap (results) {

    myMap.fitBounds(results[result].geometry.viewport);

    var boxes = [
        { title: '1218 Mall Street', content: "This is where Zane lives.", position: ZanesHouse, map: myMap },
        { title: 'freebox 1', content: "This is freebox 1", position: new LatLng(45.699667, -121.537079), map: myMap },
        { title: 'freebox 2', content: "This is freebox 2", position: new LatLng(45.705001, -121.522402), map: myMap }
    ];

    for (var index in boxes) {

        var box = boxes[index];

        cache.markers.push(new Marker(box));

// 
//      trying to get this to work:
// 

        cache.infoWindows.push(new InfoWindow({ 
            content: box.content,
            position: box.position
        }));
    }

    for (var index in cache.infoWindows) {
        cache.infoWindows[index].open(myMap);     
    }

    console.log('cache',cache)
}
