
// 3rd party modules
var mongoose = require('mongoose'),
    util = require('util'),
    utils = require('techjeffharris-utils');

var Mixed = mongoose.Schema.Types.Mixed;

var locationSchema = new mongoose.Schema({ 
    address_components: Mixed,
    formatted_address: Mixed,
    bounds: {
        sw: {
            lat: { 
                type: Number, 
                min: -90,
                max: 90,
                required: true
            },
            lng: {
                type: Number,
                min: -180,
                max: 180,
                required: true
            },
        },
        ne: {
            lat: { 
                type: Number, 
                min: -90,
                max: 90,
                required: true
            },
            lng: {
                type: Number,
                min: -180,
                max: 180,
                required: true
            }
        }
    },
    coords: {
        lat: { 
            type: Number, 
            min: -90,
            max: 90,
            required: true
        },
        lng: {
            type: Number,
            min: -180,
            max: 180,
            required: true
        }
    },
    types: Mixed
});

locationSchema.methods.lat = function () {
    return this.coords.lat;
};

locationSchema.methods.lng = function () {
    return this.coords.lng;
};

locationSchema.methods.parseAddressComponents = function () {

    var component;
    var parsed = [];
    var type;

    for (var index in this.location.address_components) {
        component = this.location.address_components[index];

        parsed[component.types[0]] = {
            long_name: component.long_name,
            short_name: component.short_name
        };
        
    }
    
    // console.log('parsed', parsed)

    return parsed;
};

locationSchema.methods.zip = function () {
    return this.parseAddressComponents().postal_code;
};

locationSchema.methods.toString = function () {
    util.format('');
};

locationSchema.virtual('parsed_components');

module.exports.schema = locationSchema;
module.exports.model = mongoose.model('Location', locationSchema);

