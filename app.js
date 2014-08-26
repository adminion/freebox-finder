
var debug = require('debug')('FreeboxFinder');

var FreeboxFinder = require('./lib/'),
    config = require('./lib/config'),
    env = require('./lib/env'),
    interrupt,
    server;

process.on('SIGINT', function () {
    if (interrupt) {
        server.stop(process.exit);
    } else {
        console.log('\n(^C again to quit)'); 
        interrupt = setTimeout(function () {
            interrupt = undefined;
        }, 1000);
    }
        
});

var server = new FreeboxFinder(config, env);

debug('server', server)

server.start();
