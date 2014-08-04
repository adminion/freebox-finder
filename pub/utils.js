
var _utils = {

    BYTE : 1, 
    MILLISECOND : 1,

    // 
    // "This one will strictly match latitude and longitude values that fall within the correct range:"
    // ...
    // Matches
    // 
    // +90.0, -127.554334 45, 180
    // -90, -180
    // -90.000, -180.0000
    // +90, +180
    // 47.1231231, 179.99999999
    // Doesn't Match
    // 
    // -90., -180.
    // +90.1, -100.111
    // -91, 123.456
    // 045, 180
    // 
    // @see: http://stackoverflow.com/a/18690202/1690165
    // 
    GPSRegExp : new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/),

    // matches valid latitude strings
    LatRegExp : new RegExp(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)$/),

    // matches valid longitude strings
    LngRegExp : new RegExp(/^[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/),

    // @see - http://killdream.github.io/blog/2011/10/understanding-javascript-oop/index.html

    // Aliases for the rather verbose methods on ES5
    descriptor  : Object.getOwnPropertyDescriptor, 
    properties  : Object.getOwnPropertyNames, 
    define_prop : Object.defineProperty,

    clone: function(parent) {
        var cloned = {};
        properties(parent).forEach(function(key) {
            define_prop(cloned, key, descriptor(parent, key)) 
        });

        return cloned;
    },

    extend: function (original, extensions) {       

        original = original || {};
        extensions = extensions || {};

        this.properties(extensions).forEach(function(key) {
            this.define_prop(original, key, this.descriptor(extensions, key)) 
        });

        return original;
    },

    getType: function (obj) {
        return (Number.isNaN(obj)) ? 'NaN' : ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },



    // returns that to which an XOR expression would evaluate
    XOR: function (a, b) {
      return ( a || b ) && !( a && b );
    }
};

_utils.KB = 1024 * _utils.BYTE;
_utils.MB = 1024 * _utils.KB;
_utils.GB = 1024 * _utils.MB;
_utils.TB = 1024 * _utils.GB;
_utils.PB = 1024 * _utils.TB;

_utils.SECOND = 1000 * _utils.MILLISECOND;
_utils.MINUTE = 60 * _utils.SECOND;
_utils.HOUR = 60 * _utils.MINUTE;
_utils.DAY = 24 * _utils.HOUR;
_utils.WEEK = 7 * _utils.DAY;
_utils.MONTH = 30 * _utils.DAY;
_utils.YEAR = 365 * _utils.DAY;
