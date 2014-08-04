
var mongoose = require('mongoose');

var boxSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, expires: 7*24*60*60 },
    tags: [ String ],
    location: {
        street1: { type: String, required: true },
        street2: { type: String, required: false },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: Number, required: true },
        coords: { type: [ Number ], index: '2d' },
        geocoded: { type: mongoose.Schema.Types.Mixed, required: true }
    }
})

module.exports.schema = boxSchema;
module.exports.model = mongoose.model('Box', boxSchema);
