# CHANGES

# v0.2
## v0.2.0
* renamed `Location.prototype.extrapolate` to `Location.prototype.update`
* `Box` model now has helpful methods for use on the server
* updated box model structure to enable easier/self-explanitory parsing of locations
* updated UI to utilize bootstrap.js tabs for search/location/new-box inputs
* list box is only a formatted address in one input rather than many inputs
* location now stores `coords` and `bounds` rather than a raw copy of google's geocoded object.
* `Location.prototype` now has methods `center()`, `cityState()`, `viewport()`, `lat()`, `lng()`, `setGeocoded()`
* once connected, client asks for boxes in their given `cityState` code.
* realtime updates to boxes within a given `cityState` code works properly
* when the map updates, if the new location's `cityState` is not equal to the old `cityState`, boxes are updated. 
* location coords saved in localStorage.FreeboxFinder to quicken/improve refreshes
* Added Terms of Service to UI
* added "Fork me on GitHub" ribbon
* implement track location functionality
* box location links are desktop/mobile compatible
* list of search results updated when boxes received
* markers and search results now have letters
* search results now only display street address
* search results, when clicked, disable lockMapToPosition, center on marker, and "BOUNCE" animation for 1425ms
* clicking on a box marker closes any other box infoWindows then toggles the clicked box infoWindow.
* setup.sh creates and starts upstart service `freebox-finder`
* "Follow Me" renamed to "Center Map on Current Position"
* set map type to "hybrid" satellite and road-map
* Center Map gets un-checked on drag, set-location, or click on search result
* "New Box" tab now labeled "Post"
* Nav tabs now ordered Location, Search, Post

#v0.1
## v0.1.0
* created client-side FreeboxFinder, Location
* moved most of stuff from `scripts.js` to `freebox-finder.js`
* created config directory for config files
* now using jade for basic layout
* created a views directory

# v0.0
## v0.0.1
* created `package.json`
* created `TODO.md`
* created `CHANGES.md`
* created `config.default.json`
* defined FreeboxFinder class - extends eventEmitter
* defined boxSchema
* setup mongoose connection
* configured FreeboxFinder#start and FreeboxFinder#stop methods
