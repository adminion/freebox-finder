
// 3rd party modules
var mongoose = require('mongoose');

var Mixed = mongoose.Schema.Types.Mixed;

var boxSchema = new mongoose.Schema({ 
    timestamp: { type: Date, default: Date.now, expires: 7*24*60*60 },
    tags: [ { type: String, lowercase: true } ],
    location: { 
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
    }
})


boxSchema.methods.lat = function () {
    return this.coords.lat;
};

boxSchema.methods.lng = function () {
    return this.coords.lng;
};

boxSchema.methods.parseAddressComponents = function () {

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

boxSchema.methods.zip = function () {
    return this.parseAddressComponents().postal_code;
};

boxSchema.methods.toString = function () {
    util.format('');
};

boxSchema.virtual('parsed_components');

module.exports.schema = boxSchema;
module.exports.model = mongoose.model('Box', boxSchema);
