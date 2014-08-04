
var Geocoder = google.maps.Geocoder,
    getCurrentPosition = navigator.geolocation.getCurrentPosition,
    InfoWindow = google.maps.InfoWindow,
    LatLng = google.maps.LatLng,
    Map = google.maps.Map,
    Marker = google.maps.Marker

var myGeocoder = new Geocoder();

function FreeboxFinder (config) {

    var self = this;
    
    if (!(this instanceof FreeboxFinder)) {
        return new FreeboxFinder();
    }

    self.boxes = [];
    self.location = new self.Location({ LatLng: config.mapOptions.center }, locationConstructed);

    self.tags = [];

    function locationConstructed () {
        self.map =  new Map(document.getElementById(config.mapId), config.mapOptions);
        self.map.addListener('dragend', mapChanged)
        self.map.addListener('zoom_changed', mapChanged)

        // setup socket
        self.socket = io();

        self.socket.on('connect', socketConnect)

        self.socket.on('boxes', socketBoxes)

        self.socket.on('new-box', socketNewBox)

        console.log('self.map', self.map);

    };

    function mapChanged () {

        var opts = { 
            LatLng: self.map.center
        }

        self.location.extrapolate(opts, function extrapolatedNewCenter () {
            setLocation();
            getBoxes();
        });
    }

    function socketConnect () {

        $('#set-location-now').click(function set_location_now_clicked () {
            console.log('set location now!')

            var newLocation = $('#new-location').val();
            console.log('newLocation', newLocation)

            self.location.extrapolate({
                address: newLocation
            }, updateMap );

        });

        $('#search-now').click(function search_tags_clicked () { 
            console.log('search tags!');

            getBoxes()
        });

        $('#new-box-now').click(function new_box_clicked () {

            var query = {
                street1: $('#box-street1').val(),
                street2: $('#box-street2').val(),
                city: $('#box-city').val(),
                state: $('#box-state').val(),
                zip: $('#box-zip').val(),
                tags: $('#tags').val()
            };

            console.log(query)

            var box = new Box(query);

            self.socket.emit('new-box', query);
        });

        // get the current location
        navigator.geolocation.getCurrentPosition(function navigator_currentPosition (position) {
            self.location.extrapolate({ 
                coords: [ 
                    position.coords.latitude, 
                    position.coords.longitude
                ]  
            }, function currentPositionExtrapolated () {
                setLocation()
                updateMap()
            });

        }, getCurrentPositionError );

    }

    function socketBoxes (boxes) {

        self.boxes = boxes;

        // delete existing boxes
        for (var index in self.boxes) {

        }
        
        console.log('self.boxes', self.boxes)

        boxes.forEach(addBoxToMap)
    }

    function socketNewBox (box) {
        cache.boxes.push(box);

        addBoxToMap(box);
    };

    function setLocation () {

        var newLocation = "<div class='container'>Latitude: " + self.location.lat()
                + ", Longitude: " + self.location.lng() + "</div>";

        $('#current-location .container').replaceWith(newLocation)

    };

    function updateMap () {
        var viewport = self.location.geocoded.geometry.viewport;
        console.log('viewport', viewport)

        self.map.fitBounds(viewport);
        // self.map.setZoom(getBoundsZoomLevel(viewport))

    };

    function getBoxes () {

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

        console.log('self.tags', self.tags)

        self.socket.emit('get-boxes', { 
            city: self.location.city,
            state: self.location.state,
            zip: self.location.zip,
            tags: self.tags
        });
    }

    function addBoxToMap (box) {

        var markerOptions,
            infoWindowOptions

        markerOptions = {
            animation: google.maps.Animation.DROP,
            map: self.map,
            position: box.location.coords
        }

        box.marker = new Marker(markerOptions)

        infoWindowOptions = { 
            content: box.content,
            position: box.location.coords
        };

        box.infoWindow = new InfoWindow(infoWindowOptions);

        box.infoWindow.open(self.map, box.marker);

        console.log('box', box)
    };


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


FreeboxFinder.prototype.setLocation = function (location) {

}

FreeboxFinder.prototype.searchTags = function (tags) {

}

FreeboxFinder.prototype.listBox = function (box) {

}

FreeboxFinder.prototype.updateMap = function () {

}


function Box (options) {



}


FreeboxFinder.prototype.Box = Box;


/**
 *  Location 
 *
 * FreeboxFinder Location class defines locations used in FreeboxFinder
 *
 * The Location constructor may be passed one the following: 
 *  * String `address` in the form `Street, City, State Zip`
 *  * String `intersection` in the form `Street1 and Street2, City, State, Zip`
 *  * google.maps.LatLng `coordinates`
 *  * 
 */
function Location (options, callback) {

    if (!(this instanceof Location)) {
        return new Location(locationOptions);
    }

    this.street1
    this.street2
    this.city
    this.state
    this.zip
    this.coords
    this.geocoded
    
    this.extrapolate(options, callback);
}

FreeboxFinder.prototype.Location = Location;


Location.prototype.parseString = function (addressStr) {
    var pieces = addressStr.split(',');

    if (pieces[0].search(/ and /) !== -1) {
        this.street1 = pieces[0].split(' and ')[0].trim();
        this.street2 = pieces[0].split(' and ')[1].trim();
    } 

    else {
        this.street1 = pieces[0].trim();
    }

    this.city = pieces[1].trim()

    this.state = pieces[2].trim().split(' ')[0].trim()
    this.zip = pieces[2].trim().split(' ')[1].trim()

    console.log('this', this)

}

Location.prototype.extrapolate = function (options, callback) {

    var self = this;
    
    // there should only be one property with one of the following names:
    //  'address', 'intersection', 'coords', or 'LatLng'

    // console.log(_utils.getType(options))

    switch (Object.keys(options)[0]) {
        case 'coords':

            // is it is a coordinate string?
            if (_utils.GPSRegExp.test(options.coords)) {
                // explode the coordinate string to make it work

                self.coords = self.stringToLatLng(String(options.coords))

                self.geocode({ location: self.coords }, callback);

            } 

            // or is a coordinate array?
            else if (_utils.getType(options.coords) === 'array') {

                console.log('options.coords', options.coords)
                self.coords = self.stringToLatLng("" + options.coords[0] + ', ' + options.coords[1]);

                self.geocode({location: self.coords }, callback);
            }

            // if not, return an error 
            else {
                throw new Error('options.coords: coordinate String expected');
            }

            break;

        case 'lat':
            // is it a valid latitude value?
            if (_utils.LatRegExp.test(options.lat)) {
                // is arg[1] is a valid longitude value?
                if (_utils.LngRegExp.test(options.lng)) {
                    // lat and lng have been provided in two separate arguments.
                    // create a LatLng, geocode the request, then parse results.

                    self.coords = new LatLng(options.lat, options.lng)
                } 

                // with valid lat given as arg 0, valid lng expected for arg 1
                else {
                    throw new Error('options.lng: valid longitude value expected!')
                }
            } 

            // it is not a valid latitude
            else {
                throw new Error('options.lat: valid latitude value expected!')
            }

            break;

        case 'intersection':
            // is it an intersection? (if it contains the word 'and')
            if (options.intersection.search(/ and /) !== -1) {
                // geocode the intersection, etc.

            }

            // then its just an address
            else {
                throw new Error('options.intersection: valid intersection expected!')
            }

            break;

        case 'address':
            self.geocode({
                address: options.address
            }, callback)
            break;

        case 'LatLng': 
            // is it a google.maps.LatLng?
            if (options.LatLng instanceof LatLng) {

                self.coords = options.LatLng

                self.geocode({
                    location: self.coords
                }, callback)
            }

            // return error
            else {
                throw new Error('options.LatLng: valid LatLng expected!')
            }

            break;
        default:
            console.log('options:', options)
            throw new Error('error: arg 0: String address, intersection, coordinates, ' 
                + 'Number latidude, or google.maps.LatLng expected!');
            break;
    }
}

Location.prototype.geocode = function (request, callback) {

    var self = this;

    myGeocoder.geocode(request, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {

            var result = results[0]

            console.log('result', result);

            self.geocoded = result;

            self.parseString(result.formatted_address)

            callback(result, status);
            
        } else {

            console.log('status', status)
        }
    });

}

Location.prototype.lat = function () {
    return this.coords.lat();
}

Location.prototype.lng = function () {
    return this.coords.lng();
}

Location.prototype.stringToLatLng = function (coordStr) {

    // console.log(coordStr)c

    var pieces = coordStr.split(',')

    return new LatLng(pieces[0].trim(), pieces[1].trim() );
}

/**
 *  Location.prototype.toString
 *
 * @returns an object containing city, state, zip for this location.
 */
Location.prototype.toString = function () {
        
    var locationString = this.string1;

    if (this.string2) {
        locationString += " and " + this.street2;
    }

    locationString += ", " + this.city + ", " + this.state + " " + this.zip

    console.log('locationString', locationString);

    return locationString;
}


