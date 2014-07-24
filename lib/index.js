
// node core modules
var events = require('events'),
    fs = require('fs'),
    http = require('http');

// 3rd party modules
var debug = require('debug')('FreeboxFinder:lib'),
    express = require('express'),
    mongoose = require('mongoose'),
    Socketio = require('socket.io'),
    serveStatic = require('serve-static');

// native modules
var Box = require('./box');

function FreeboxFinder (config, env) {

    var app = express(),
        index,
        self = this;

    this.config = config;
    this.env = env;

    this.connection = mongoose.connection;

    this.connection.on('connecting', function () {
        debug('connecting to mongodb...');
    });

    this.connection.on('connected', function () {
        debug('connected to mongodb!');
        self.emit('connected to mongodb');
    });

    this.connection.on('disconnecting', function () {
        // debug('disconnecting from mongodb...');
    });

    this.connection.on('disconnected', function () {
       debug('disconnected from mongodb!'); 
    });

    this.connection.on('close', function () {
        self.emit('mongodb connection closed!');
    });

    // if the connection has an error, output the error:
    this.connection.on('error', function () {
        console.error.bind(console, 'mongodb connection error:');
        process.exit();
    });

    // once the connection is open
    this.connection.once('open', function mongooseConnected () {

        self.server.listen(config.port, function () {
            self.emit('started');

            console.log('\nFreeboxFinder server started: %s', self.env.url());
        });
    });

    app.get('/', function (request, response) {

        // if (index) {
        //     response.end(index);
        // } else {
            fs.readFile('pub/index.html', function (err, file) {
                if (err) {
                    response.writeHead(500);
                    response.end('<!doctype html><html><body><h1>Server Error :(</h1><h2>whoops..</h2><body></html>');
                }

                index = file

                debug('index',index);
                response.end(index);

            });
        // }
    });

    // serve static content if no routes were found
    app.use(serveStatic('pub'));

    this.server = http.Server(app);
    this.io = new Socketio(this.server);

    this.io.on('connection', function (socket) {
        // socket.on('')
    });

}

FreeboxFinder.prototype = new events.EventEmitter();

FreeboxFinder.prototype.start = function () {
    debug('Starting FreeboxFinder server...');

    this.emit('starting');

    mongoose.connect(this.config.mongodb.uri, this.config.mongodb.options); 

    return true;

}

FreeboxFinder.prototype.stop = function () {
    var self = this,
        shutdownTimeout = 2000,
        shutdownTimer;

    debug('Stopping FreeboxFinder server...');

    this.emit('stopping');

    this.server.close(function () {
        debug('FreeboxFinder server stopped!');
        this.emit('stopped');
        process.exit();
    });

    shutdownTimer = setTimeout(function() {
        debug('shutdown timeout!');
        self.emit('stopped');
        process.exit(); 
    }, shutdownTimeout);

}

module.exports = FreeboxFinder;
