
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

    app.set('view engine', 'jade');

    app.get('/', function (request, response) {
           
        response.render('index');
        
    });

    // serve static content if no routes were found
    app.use(serveStatic('pub'));

    this.server = http.Server(app);
    this.io = new Socketio(this.server);

    this.io.on('connection', function (socket) {
        socket.on('new-box', function (newBox) {

            // create a new Box
            var box = new Box.model(newBox);

            // save the box to the database
            box.save(function (err, savedBox) {
                // if an error occurs, send it to our error handler
                if (err) dbError(err)

                // if the box was saved successfully
                else {
                    // tell all boxes in this box's city that a new box has been posted
                    io.in(savedBox.zip).emit('new-box', savedBox);
                }
            });
        });

        socket.on('get-boxes', function (query) {

            debug('query', query);

            // search for tags in the given city or state
            var findOptions = { 
                city: query.city, 
                state: query.state, 
                tags: { 
                    or: query.tags 
                }
            };

            // if the socket has a 'zip' code, it was in that room
            if ('zip' in socket) {
                // let's remove it from that room, so it doesn't get bombarded
                // with new box notifications for old zip codes
                socket.leave(socket.zip);
            }

            // set the zip code of the boxes to the socket
            socket.zip = query.zip;
            // have the socket join room who's name is the value of the zip code for updates
            socket.join(query.zip)

            // build the boxes query
            Box.model.where('city', query.city)
                .where('state', query.state)
                .where('tags').in(query.tags)
                .exec(function (err, boxes) {
                    // if an error occurs, send it to our error handler
                    if (err) dbError(err)

                    // if the query was executed successfully
                    else {
                        // respond to the client's request with boxes
                        socket.emit('boxes', boxes);
                    }
                }
            );
        });

    });

}

FreeboxFinder.prototype = new events.EventEmitter();

FreeboxFinder.prototype.start = function () {
    debug('Starting FreeboxFinder server...');

    this.emit('starting');

    mongoose.connect(this.config.mongodb.uri, this.config.mongodb.options); 

    return true;

}

FreeboxFinder.prototype.stop = function (done) {
    var self = this,
        shutdownTimer;

    debug('Stopping FreeboxFinder server...');

    this.emit('stopping');

    this.server.close(function () {
        debug('FreeboxFinder server stopped!');
        this.emit('stopped');
        done();
    });

    shutdownTimer = setTimeout(function() {
        debug('shutdown timeout!');
        self.emit('stopped');
        process.exit(); 
    }, self.config.shutdownTimeout);

}

function dbError (err) {
    console.error(err)
}

module.exports = FreeboxFinder;
