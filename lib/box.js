
var mongoose = require('mongoose');

var boxSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, expires: 7*24*60*60 },
    tags: [ String ],
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: Number, required: true },
    },
    geo: { type: [ Number ], index: '2d' }
});

module.exports.schema = boxSchema;
module.exports.model = mongoose.model('Box', boxSchema);
