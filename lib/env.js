
// node core modules
var os = require('os'), 
    env = {}; 

module.exports = env;

// 3rd party modules
var debug = require('debug')('FreeboxFinder:env');

var config  = require('./config');

env.prefix      = process.cwd();

env.net = { 
    addresses : [],
    port : config.port,
    protocol : (config.https) ? 'https' : 'http',
    ssl : ((config.https) ? require('./transport/http/ssl') : undefined)
};

debug('env', env)

var address,
    iface,
    interfaces = os.networkInterfaces(), 
    ip;

// for each interface available...
for (iface in interfaces) {
    // for each address assigned to this interface..
    for (address in interfaces[iface]) {
        // get the properties of this address
        ip = interfaces[iface][address];
        // make sure its IPv4 and its not internal
        if (ip.family == 'IPv4' && !ip.internal) {
            // add it to the list of IPs avaialble
            env.net.addresses.push(ip.address);
        }
    }
}

/**
 * env.url(addressIndex) - generate URL, optionally using the given index of an 
 *      IP address contained in env.net.addresses
 *  
 *  @param: addressIndex
 *      specifies which IP address to use from env.net.addresses
 *  
 *  @return: String
 *      the ge
 *  
 *  @see: env.net.addresses
 */
env.url = function (addressIndex) {

    addressIndex = addressIndex || 0;

    var address = env.net.addresses[addressIndex] || 'localhost',
        url = env.net.protocol + '://' + address;

    if (env.net.port !== 80 ) {
        url += ':' + env.net.port;
    }

    return url;
}

debug('env', env);
