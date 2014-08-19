
var Geocoder = google.maps.Geocoder,
    getCurrentPosition = navigator.geolocation.getCurrentPosition,
    InfoWindow = google.maps.InfoWindow,
    LatLng = google.maps.LatLng,
    Map = google.maps.Map,
    Marker = google.maps.Marker

var myGeocoder = new Geocoder();

function FreeboxFinder () {

    // check for geolocation support
    if (!(navigator.geolocation)) {

        var newBody = "<body><h1>Crap...</h1>"
        + "<h2>Your browser sucks.  This isn't going to work.</h2>"
        + "<h3>You should upgrade your browser.</h3>"
        + "<h4>Actually, you should just use Chrome.</h4></body>"
        
        $("body").replaceWith(newBody);

        throw new Error('FreeboxFinder - Fatal: geolocation support required!')
    } 

    var self = this;
    
    if (!(this instanceof FreeboxFinder)) {
        return new FreeboxFinder();
    }

    self.boxes = [];
    self.infoWindows = [];
    self.markers = [];
    self.tags = [];

    // get the current location
    navigator.geolocation.getCurrentPosition(function navigator_currentPosition (position) {
        console.error('navigator_currentPosition')

        var location = new LatLng(position.coords.latitude, position.coords.longitude)  

        self.location = new self.Location({ location: location }, locationConstructed);        

    }, getCurrentPositionError );

    function addBoxToMap (box) {

        console.error('addBoxToMap')

        var infoWindowOptions,
            position = new LatLng(
                box.location.geometry.location.k,
                box.location.geometry.location.B),
            markerOptions;

        console.log('adding box to map: ', box)

        markerOptions = {
            animation: google.maps.Animation.DROP,
            map: self.map,
            position: position
        }

        // var marker = new Marker(markerOptions);

        // self.markers.push(marker);

        // infoWindowOptions = { 
        //     content: 'tags: ' + box.tags.join(', '),
        //     position: position
        // };

        // var infoWindow = new InfoWindow(infoWindowOptions);

        // self.infoWindows.push(infoWindow);

        // infoWindow.open(self.map, marker);

    };

    /**
     *  Get the best zoom level for a given LatLngBounds 
     *
     * @credit: http://jsfiddle.net/john_s/BHHs8/6/
     */
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
    };


    function getBoxes () {

        console.error('getBoxes')

        self.tags = [];

        $('#tags')
            .val()
            .split(', ')
            .forEach(function(piece) {

                if (piece || piece !== '') {
                    console.log('piece', piece)
                    self.tags.push(piece.trim())
                }
            });

        var zip = self.location.address_components.postal_code.long_name

        console.log('zip', zip)

        var logStr = 'getting boxes in ' + zip
        if (self.tags.length >0)  {
            logStr += ' with tags "' + self.tags.join('", "') + '"'
        }

        self.socket.emit('get-boxes', zip, self.tags );
    };

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
                
    };

    function locationConstructed () {

        console.error('locationConstructed')

        console.log(self.location.geometry)

        self.map = new Map($('#map-canvas')[0], {
            zoom: 4,
            center: self.location.geometry.location
        });

        setLocation()
        updateMap(self.location.geometry.viewport)
        
       // setup socket
        self.socket = io();

        self.socket.on('connect', socketConnect)

        self.socket.on('boxes', socketBoxes)

        self.socket.on('new-box', socketNewBox)

        console.log('self', self);


    };

    function mapChanged () {

        console.error('mapChanged')

        var oldZip = self.location.zip;

        var opts = { 
            location: self.map.center
        }

        self.location.update(opts, function mapUpdated () {
            setLocation();
        });
    };

    function setLocation () {

        console.error('setLocation')

        var newLocation = "<div class='container'><p>" + self.location.formatted_address + "</p>"

                + "<p>Latitude: " + self.location.lat()
                + ", Longitude: " + self.location.lng() + "</p></div>";

        $('#current-location .container').replaceWith(newLocation)

    };

    function socketBoxes (boxes) {

        console.error('socketBoxes')

        console.log('boxes', boxes);

        self.boxes = boxes;

        console.log('self.boxes', self.boxes)

        boxes.forEach(function (box) {
            addBoxToMap(box)

        });
    };

    function socketConnect () {

        console.error('socketConnect')

         self.map.addListener('dragend', mapChanged)
        // self.map.addListener('rightClick')
        self.map.addListener('zoom_changed', mapChanged)

        getBoxes();

        $('#set-location-now').click(function set_location_now_clicked () {
            console.error('set location now!')

            var newAddress = $('#new-location').val();
            console.log('newAddress', newAddress)

            var oldZip = self.location.address_components.postal_code.long_name;

            console.log('oldZip', oldZip);

            self.location.geocode({address: newAddress}, function (result, status) {

                if (self.location.geometry.location !== result.geometry.location) {

                    console.log('old/new locations match, NOT updating map!')
                    
                    updateMap(result.geometry.viewport)
                    
                } else {
                    console.log('old/new locations DO NOT match, updating map!')
                }

                var parsed = parseAddressComponents(result);

                if (oldZip !== parsed.postal_code.long_name) {
                    console.log('old/new zip codes DO NOT match, getting boxes!')

                    getBoxes();


                } else {
                    console.log('old/new zip codes match, NOT getting boxes!')
                }
            });


        });

        $('#search-now').click(getBoxes);

        $('#new-box-now').click(function new_box_clicked () {

            var addressStr = $('#box-location').val();

            console.log('addressStr', addressStr)

            var newBoxLocation = new Location({ address: addressStr}, function newBoxLocationConstructed () {

                console.log('newBoxLocationConstructed')
                var box = new Box({ 
                    location: newBoxLocation,
                    tags: $('#box-tags').val()
                })

                self.socket.emit('new-box-now', box);
            })
                    
            
        });

    };


    function socketNewBox (box) {

        console.error('socketNewBox')

        self.boxes.push(box);

        console.log('new box:', box)

        addBoxToMap(box);
    };


    function updateMap (viewport) {

        console.error('updateMap')
        
        self.map.fitBounds(viewport);
        // self.map.setZoom(getBoundsZoomLevel(viewport))

    };


};


FreeboxFinder.prototype.setLocation = function (location) {

};

FreeboxFinder.prototype.searchTags = function (tags) {

};

FreeboxFinder.prototype.listBox = function (box) {

};

FreeboxFinder.prototype.updateMap = function () {

};


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////    Box
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function Box (newBox) {
    this.location = newBox.location;
    this.tags = newBox.tags;
}


FreeboxFinder.prototype.Box = Box;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////
////    Location
////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 *  Location 
 *
 * FreeboxFinder Location class defines locations used in FreeboxFinder
 *
 * The location passed to the constructor may be passed one the following: 
 *  * String `address` in the form `Street, City, State Zip`
 *  * String `intersection` in the form `Street1 and Street2, City, State, Zip`
 *  * google.maps.LatLng `coordinates`
 *  * 
 */
function Location (options, callback) {

    if (!(this instanceof Location)) {
        return new Location(locationOptions);
    }

    this.address_components;
    this.formatted_address;
    this.geometry;
    this.types
    
    this.update(options, callback);
}

FreeboxFinder.prototype.Location = Location;


Location.prototype.update = function (options, callback) {

    console.error('Location.update')

    var self = this;
    
    self.geocode(options, function locationUpdated (result, status) {

        console.error('locationUpdated')
        
        self.address_components = self.parseAddressComponents(result);
        self.formatted_address = result.formatted_address;
        self.geometry = result.geometry;
        self.types = result.types;

        // console.log('self', self);

        callback()
    });

}

Location.prototype.geocode = function (request, callback) {

    console.error('location.geocode')

    var self = this;

    myGeocoder.geocode(request, function locationGeocoded(results, status) {

        console.error('locationGeocoded')

        if (status == google.maps.GeocoderStatus.OK) {

            var result = results[0]

            console.log('result', result);

            callback(result, status);
            
        } else {

            console.log('google.maps.Geocoder status:', status)
        }
    });

}

Location.prototype.lat = function () {
    return this.geometry.location.k;
}

Location.prototype.lng = function () {
    return this.geometry.location.B;
}

Location.prototype.parseAddressComponents = function (result) {

    console.error('parseAddressComponents')

    var component;
    var parsed = [];
    var type;

    console.log('result', result)

    for (var index in result.address_components) {
        component = result.address_components[index];

        parsed[component.types[0]] = {
            long_name: component.long_name,
            short_name: component.short_name
        }
        
    }
    
    console.log('parsed', parsed)

    return parsed

}

/**
 *  Location.prototype.toString
 *
 * @returns an object containing city, state, zip for this location.
 */
Location.prototype.toString = function () {
        
    var locationString = this.street1;

    if (this.street2) {
        locationString += " and " + this.street2;
    }

    locationString += ", " + this.city + ", " + this.state + " " + this.zip

    console.log('locationString', locationString);

    return locationString;
}


