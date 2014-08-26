/**
 * configuration module
 * 
 * assigns a map of configuration settings to configuration
 */

var debug = require('debug')('FreeboxFinder:config');

var configFile = require('../config/config.json'),
    defaults = require('../config/config.default.json'),
    utils = require('techjeffharris-utils');
    configuration = utils.extend(defaults, configFile, true);

// debug('configFile', configFile);
// debug('defaults', defaults);
debug('configuration', configuration);

module.exports = configuration; 
