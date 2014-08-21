
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

var banner = fs.readFileSync('lib/banner')

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

            console.log('\nFreeboxFinder server started! Connect thusly: %s', self.env.url(true));
        });
    });

    app.set('view engine', 'jade');

    app.get('/', function (request, response) {
           
        response.render('index');
        
    });

    // serve static content if no routes were found
    app.use(serveStatic('pub'));

    this.server = http.Server(app);

    this.on('started', function () {
        console.log ("\n%s",String(banner).trim())
    });

    this.io = new Socketio(this.server);

    this.io.on('connection', function (socket) {

        // socket.emit('EventEmitter', events.EventEmitter);

        socket.on('new-box-now', function (newBox) {

            debug('newBox', newBox);

            // create a new Box
            var box = new Box.model(newBox);


            // save the box to the database
            box.save(function (err, savedBox) {
                // if an error occurs, send it to our error handler
                if (err) {
                    dbError(err)
                }

                
                // if the box was saved successfully
                else {

                    var zip = savedBox.location.address_components.postal_code.long_name

                    debug('savedBox', savedBox);

                    // tell all boxes in this box's city that a new box has been posted
                    self.io.in(zip).emit('new-box', savedBox.toObject());
                }
            });
                
        });

        socket.on('get-boxes', function socketGetBoxes (zip, tags) {

            tags = tags || [];

            debug('gettings boxes in ' + zip);

            // if the socket has a 'zip' code, and it has changed
            if ('zip' in socket && socket.zip !== zip) {
                // let's remove it from that room, so it doesn't get bombarded
                // with new box notifications for old zip codes
                socket.leave(socket.zip);
            }

            // set the zip code of the boxes to the socket
            socket.zip = zip;
            
            // have the socket join room who's name is the value of the zip code for updates
            socket.join(zip);
            debug('socket joining room ' + zip);

            // build the boxes query
            var query = Box.model
                .where('location.address_components.postal_code.long_name', zip);

            if (tags.length > 0) {

                console.log('tags specified!  querying for tags:', tags)

                query.where('tags').in(tags);
            }

            query.exec(function gotBoxes(err, boxes) {
                // if an error occurs, send it to our error handler
                if (err) {
                    dbError(err);
                }

                // if the query was executed successfully
                else {

                    var rawBoxes = {};

                    for (var box in boxes) {
                        rawBoxes[box] = boxes[box].toObject();
                    }

                    debug('boxes', boxes);
                    // respond to the client's request with boxes
                    socket.emit('boxes', boxes);
                }
            });
        });

    });

    function dbError (err) {
        debug('Error: ', err)
    }

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

module.exports = FreeboxFinder;
