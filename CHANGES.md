# CHANGES

# v0.2
## v0.2.0
* renamed Location.prototype.extrapolate to Location.prototype.update
* box model now has helpful methods for use on the server
* updated box model structure to enable easier/self-explanitory parsing of locations
* updated UI to utilize bootstrap.js tabs for search/location/new-box inputs
* list box is only a formatted address in one input rather than many inputs
* location now stores `coords` and `bounds` rather than a raw copy of google's geocoded object.
* Location.prototype now has center(), cityState(), viewport(), lat(), lng(), setGeocoded()
* once connected, client asks for boxes in their given cityState code.
* realtime updates to boxes within a given cityState code works properly
* when the map updates, if the new location's cityState is not equal to the old cityState, boxes are updated. 
* location coords saved in localStorage.FreeboxFinder_location to speed up refreshes
* Added Terms of Service to UI

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
