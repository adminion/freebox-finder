
var Circle = google.maps.Circle,
    Geocoder = google.maps.Geocoder,
    getCurrentPosition = navigator.geolocation.getCurrentPosition,
    InfoWindow = google.maps.InfoWindow,
    LatLng = google.maps.LatLng,
    LatLngBounds = google.maps.LatLngBounds,
    Map = google.maps.Map,
    Marker = google.maps.Marker,
    Point = google.maps.Point,
    Size = google.maps.Size

var myGeocoder = new Geocoder();

function FreeboxFinder () {

    // check for geolocation support
    if (!(navigator.geolocation)) {

        var newBody = "<body><h1>Crap...</h1>"
        + "<h2>Your browser sucks.  This isn't going to work.</h2>"
        + "<h3>You should upgrade your browser.</h3>"
        + "<h4>Really, you should just use Chrome.</h4></body>"
        
        $("body").replaceWith(newBody);

        throw new Error('FreeboxFinder - Fatal: geolocation support required!')
    } 

    var self = this;
    
    if (!(this instanceof FreeboxFinder)) {
        return new FreeboxFinder();
    }

    self.boxes = [];
    self.infoWindows = [];
    self.initialized = false;
    self.markers = [];
    self.tags = [];

    var currentLocationMarker,
        currentLocationRadius;

    console.log('localStorage', localStorage)

    // check localStorage for a cached location
    if (localStorage.getItem("FreeboxFinder_location")) {

        console.log('using cached location!');

        var cached = JSON.parse(localStorage.getItem("FreeboxFinder_location")).location;

        console.log('cached', cached)
        
        self.location = new self.Location({
            location: new LatLng(cached.lat, cached.lng)
        }, locationConstructed);

    }

    else {

        console.log('no cached position, using html5 navigator!');
        
        // get the current location
        navigator.geolocation.getCurrentPosition(function navigator_currentPosition (position) {
            
            var location = new LatLng(position.coords.latitude, position.coords.longitude)  

            self.location = new Location({ location: location }, locationConstructed);

        }, getCurrentPositionError );
    }


    function addBoxToMap (box) {

        var infoWindowOptions,
            position = new LatLng(
                box.location.coords.lat,
                box.location.coords.lng),
            markerOptions;

        console.log('adding box to map: ', box)

        markerOptions = {
            map: self.map,
            position: position
        }

        var marker = new Marker(markerOptions);

        self.markers.push(marker);

        var query = box.location.formatted_address.split(' ').join('+');

        console.log('query', query);

        var mobile = (/android/g.test(ua) || /(ipad|iphone|ipod)/g.test(ua));

        var ua = navigator.userAgent.toLowerCase();

        var linkUrl = (mobile)
            ? "geo:0,0?='" + query + "'" 
            : "http://google.com/maps/place/" + query;

        var link = '<a href="' + linkUrl + '"';

        if (!mobile) {
            link += ' target="_blank"';
        }

        link += '>' + box.location.formatted_address + '</a>'

        var infoWindowContent = '<p><strong>tags:</strong> ' + box.tags.join(', ') + '</p>'
            + '<p><strong>location:</strong>' + link + '</p>';

        infoWindowOptions = { 
            content: infoWindowContent,
            position: position
        };

        var infoWindow = new InfoWindow(infoWindowOptions);

        self.infoWindows.push(infoWindow);

        marker.addListener('click', function () {
            infoWindow.open(self.map, marker);
        })


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

        self.tags = [];

        $('#tags')
            .val()
            .split(', ')
            .forEach(function(tag) {

                if (tag || tag !== '') {
                    console.log('tag', tag)
                    self.tags.push(tag.trim().toLowerCase())
                }
            });

        var logStr = 'getting boxes in ' + self.location.cityState();
        if (self.tags.length >0)  {
            logStr += ' with tags "' + self.tags.join('", "') + '"'
        }

        self.socket.emit('get-boxes', self.location.cityState(), self.tags );
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

        $('#cityState .container').replaceWith("<div class='container'>" + msg + " </div>")
        console.log(msg)
                
    };

    function locationConstructed () {

        console.log('self.location.coords', self.location.coords)

        self.map = new Map($('#map-canvas')[0], {
            zoom: 4,
            center: self.location.center()
        });

        self.map.fitBounds(self.location.viewport());
        setLocation();

       // setup socket
        self.socket = io();

        self.socket.on('connect', socketConnect)

        self.socket.on('boxes', socketBoxes)

        self.socket.on('new-box', socketNewBox)

        self.socket.on('shutdown', function () {
            console.log('received shutdown signal from server!');
            self.socket.close();
            self.socket = undefined;
        });

        console.log('self', self);
    };

    function mapChanged () {

        var oldZip = self.location.zip();

        self.location.geocode({ location: self.map.center }, newLocationGeocoded);

        function newLocationGeocoded (result, status) {

            var parsed = self.location.parseAddressComponents(result);

            if (self.location.formatted_address !== result.formatted_address) {
                self.location.setGeocoded(result)
                setLocation();

                if (oldZip !== parsed.postal_code.long_name) {
                    getBoxes();
                }
            } else {
                console.log('self.location', self.location)
                self.location.setCoords(result.geometry.location)
                setLocation();
            } 
        };
    };

    function setLocation () {

        $('#cityState .container').replaceWith("<div class='container'><p>" + self.location.cityState() + "</p></div>");
        $('#current-location .container').replaceWith("<div class='container'><p>" + self.location.formatted_address + "</p></div>");
        $('#new-box-location').attr('placeholder', self.location.formatted_address);

        // store a LatLngLiteral to localStorage to speed up map generation and help remedy inaccurate location resolution
        localStorage.setItem('FreeboxFinder_location', JSON.stringify({ location: self.location.coords }) );

    };

    function socketBoxes (boxes) {

        console.log('boxes', boxes);

        self.boxes = boxes;

        console.log('self.boxes', self.boxes)

        for (var marker in self.markers) {
            self.markers[marker].setMap();
        }

        self.infoWindows = [];
        self.markers = [];

        var boxesList = '<div id="results"><ol>';

        boxes.forEach(function (box, id) {
            addBoxToMap(box)

            boxesList += '<li><a id="box-' + id + '">' + box.location.formatted_address + '</a></li>';
        });

        boxesList += '</ol></div>';

        $('#results').replaceWith(boxesList);
    };

    function socketConnect () {

        var watchID;

        getBoxes();

        if (!self.initialized) {

            self.map.addListener('dragend', mapChanged);
            self.map.addListener('zoom_changed', mapChanged);

            $('#track-location').click(function track_location_change () {
                if (this.checked) {
                    console.log('tracking enabled');

                    var geo_options = {
                        enableHighAccuracy: true, 
                        maximumAge        : 30000, 
                        timeout           : 27000
                    };

                    watchID = navigator.geolocation.watchPosition(watchPositionChanged, watchPositionError, geo_options);

                    function watchPositionChanged (position) {

                        console.log('position', position)

                        var location = new LatLng(position.coords.latitude, position.coords.longitude) 

                        if (currentLocationMarker) {
                            currentLocationMarker.setPosition(location);
                            currentLocationMarker.setVisible(true);
                        } else {
                            currentLocationMarker = new Marker({
                                icon: {
                                    anchor: new Point(5, 5),
                                    scaledSize: new Size(10, 10),
                                    url: 'http://upload.wikimedia.org/wikipedia/commons/5/5a/Button_Icon_BlueSky.svg'
                                },
                                map: self.map,
                                position: location,
                            });
                        }

                        if (currentLocationRadius) {
                            currentLocationRadius.setCenter(location);
                            currentLocationRadius.setVisible(true);
                        } else {
                            currentLocationRadius = new Circle({
                                center: location,
                                fillColor: '#3399FF',
                                map: self.map,
                                strokeColor: '#3300FF',
                                strokeWeight: 0.5,
                                radius: position.coords.accuracy
                            });       
                        }

                        self.map.setCenter(location);
                    };

                    function watchPositionError() {

                    }

                }

                else { 
                    console.log('tracking disabled');
                    navigator.geolocation.clearWatch(watchID);
                    watchID = undefined;

                    if (currentLocationRadius) {
                        currentLocationRadius.setVisible(false)
                    }

                    if (currentLocationMarker) {
                        currentLocationMarker.setVisible(false)
                    }
                }

            });

            $('#set-location-now').click(set_location_now_clicked);
            $('#new-location').keyup(function (event) {
                if (event.which === 13) {
                    set_location_now_clicked();
                }
            });

            $('#search-now').click(getBoxes);
            $('#tags').keyup(function (event) {
                if (event.which === 13) {
                    getBoxes()
                }
            });

            $('#new-box-location').attr('placeholder', self.location.formatted_address)
                .keyup(function (event) {
                    if (event.which === 13) {
                        new_box_clicked()
                    }
                });

            $('#new-box-now').click(new_box_clicked);

            self.initialized = true;
        }

        function getLocation () {
            // get the current location
            navigator.geolocation.getCurrentPosition(function (position) {

                var location = new LatLng(position.coords.latitude, position.coords.longitude)  

                self.location.update({ location: location }, function () {
                    self.map.fitBounds(self.location.viewport());
                    setLocation();
                });

            }, getCurrentPositionError);
        };

        function new_box_clicked () {
            var addressStr = $('#new-box-location').val() || self.location.formatted_address;
            var tagsArr = $('#new-box-tags').val().toLowerCase().split(',')
            var tags =[]

            console.log('tagsArr', tagsArr)

            if (tagsArr.length > 0) {
                tagsArr.forEach(function (tag) {
                    console.log('tag', tag);
                    tags.push(tag.trim());
                });
            }
            
            console.log('addressStr', addressStr);

            if (addressStr.length >= 2 && tags.length >= 1) {
                var newBoxLocation = new Location({ address: addressStr}, function newBoxLocationConstructed () {

                    console.log('newBoxLocationConstructed');

                    console.log('newBoxLocation', newBoxLocation);

                    var box = new Box({ 
                        location: newBoxLocation,
                        tags: tags
                    });

                    console.log('newBox', box);

                    self.socket.emit('new-box-now', box);
                });                
            }

            else {
                alert('You need to enter at least a ')
            }

        };

        function set_location_now_clicked () {
            $('#track-location').click();

            var newAddress = $('#new-location').val();
            console.log('newAddress', newAddress);

            self.location.geocode({address: newAddress}, function (result, status) {
                self.map.fitBounds(result.geometry.viewport);
            });
        };

    };


    function socketNewBox (box) {

        self.boxes.push(box);

        console.log('new box:', box)

        addBoxToMap(box);
    };

};


FreeboxFinder.prototype.setLocation = function (location) {

};

FreeboxFinder.prototype.searchTags = function (tags) {

};

FreeboxFinder.prototype.listBox = function (box) {

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
    this.coords = { 
        lat: undefined,
        lng: undefined
    };
    this.bounds = {
        ne: {
            lat: undefined,
            lng: undefined,
        },
        sw: {
            lat: undefined,
            lng: undefined
        }
    }

    this.types;
    
    this.update(options, callback);
}

FreeboxFinder.prototype.Location = Location;


Location.prototype.center = function () {

    return new LatLng(this.coords.lat, this.coords.lng)
}

Location.prototype.cityState = function () {

    return this.address_components.locality.short_name + ', ' + this.address_components.administrative_area_level_1.short_name;

}

Location.prototype.geocode = function (request, callback) {

    var self = this;

    myGeocoder.geocode(request, function locationGeocoded(results, status) {

        if (status == google.maps.GeocoderStatus.OK) {

            var result = results[0]

            // console.log('result', result);

            callback(result, status);
            
        } else {

            console.log('google.maps.Geocoder status:', status)


        }
    });

}

Location.prototype.lat = function () {



    return this.coords.lat;
}

Location.prototype.lng = function () {
    return this.coords.lng;
}


Location.prototype.parseAddressComponents = function (result) {

    var component;
    var parsed = {};
    var type;

    // console.log('result', result)

    for (var index in result.address_components) {
        component = result.address_components[index];

        parsed[component.types[0]] = {
            long_name: component.long_name,
            short_name: component.short_name
        }
        
    }
    
    // console.log('parsed', parsed)

    return parsed

}

Location.prototype.sameAs = function (testLocation) {

    return (this.coords.lat === testLocation.lat() && this.coords.lng === testLocation.lng())

};

Location.prototype.setCoords = function (coords) {
    
    this.coords.lat = coords.lat();
    this.coords.lng = coords.lng();
};

Location.prototype.setGeocoded = function (result, status) {

    // console.log('result', result)

    var ne = result.geometry.viewport.getNorthEast();
    var sw = result.geometry.viewport.getSouthWest();

    this.address_components = this.parseAddressComponents(result);
    this.formatted_address = result.formatted_address;
    this.types = result.types;
    
    this.coords.lat = result.geometry.location.lat();
    this.coords.lng = result.geometry.location.lng();

    this.bounds.ne.lat = ne.lat();
    this.bounds.ne.lng = ne.lng();
    this.bounds.sw.lat = sw.lat();
    this.bounds.sw.lng = sw.lng();

    console.log('this', this);

}

/**
 *  Location.prototype.toString
 *
 * @returns an object containing city, state, zip for this location.
 */
Location.prototype.toString = function () {
        
    return this.formatted_address;
}

Location.prototype.update = function (options, callback) {

    var self = this;
    
    self.geocode(options, function locationUpdated (result, status) {
        self.setGeocoded(result);

        callback()

    });

}


Location.prototype.viewport = function () {

    var ne = new LatLng(this.bounds.ne.lat, this.bounds.ne.lng);
    var sw = new LatLng(this.bounds.sw.lat, this.bounds.sw.lng);

    return new LatLngBounds(sw, ne);

}

Location.prototype.zip = function () {
    return this.address_components.postal_code.long_name;
}

