
// 3rd party modules
var mongoose = require('mongoose');

// Freebox-Finder modules
var location = require('./location');

var boxSchema = new mongoose.Schema({ 
    timestamp: { type: Date, default: Date.now, expires: 7*24*60*60 },
    tags: [ String ],
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location'} 
})

module.exports.schema = boxSchema;
module.exports.model = mongoose.model('Box', boxSchema);
