
// node core modules
var events = require('events'),
    fs = require('fs'),
    http = require('http');

// 3rd party modules
var debug = require('debug')('FreeboxFinder_Server:lib'),
    express = require('express'),
    mongoose = require('mongoose'),
    Socketio = require('socket.io'),
    serveStatic = require('serve-static');

// native modules
var Box = require('./box');

var banner = fs.readFileSync('lib/banner'),
    terms = fs.readFileSync('lib/TERMS')

var shutdownTimer;

function FreeboxFinder_Server (config, env) {

    var app = express(),
        index,
        self = this;


    this.clients = [];
    this.config = config;
    this.env = env;

    this.connection = mongoose.connection;
    this.connection.on('connecting',    dbConnecting);
    this.connection.on('disconnecting', dbDisconnecting);
    this.connection.on('disconnected',  dbDisconnected);
    this.connection.on('close',         dbClose);
    this.connection.on('error',         dbError);

    this.connection.once('open', dbConnected);

    app.set('view engine', 'jade');

    app.get('/', function (request, response) {
        response.render('index', { license: terms });
    });

    // serve static content if no routes were found
    app.use(serveStatic('pub'));

    this.server = http.Server(app);

    this.server.on('connection', function (client) {
        self.clients.push(client);
        client.setTimeout(5000);
        client.once('close', function () {
            debug('client closed');
            self.clients.splice(self.clients.indexOf(client), 1)
        });
    });

    this.io = new Socketio(this.server);

    this.io.on('connection', ioConnection);

    this.on('started', FreeboxFinderStarted);

    function dbClose () {
        self.emit('mongodb connection closed!');
    };
    
    function dbConnected () {
        debug('connected to mongodb!');

        self.server.listen(config.port, serverListening);
    };

    function dbConnecting () {
        debug('connecting to mongodb...');
    };  

    function dbDisconnected () {
        debug('arguments', arguments)
        debug('disconnected from mongodb!'); 
    };

    function dbDisconnecting () {
        // debug('disconnecting from mongodb...');
    };

    function dbError () {
        console.error.bind(console, 'mongodb connection error:');
        process.exit();
    };

    function ioConnection (socket) {

        // socket.emit('EventEmitter', events.EventEmitter);

        socket.on('new-box-now', socketNewBox);

        socket.on('get-boxes', socketGetBoxes);

        function gotBoxes(err, boxes) {
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
        }

        function socketGetBoxes (cityState, tags) {

            tags = tags || [];

            debug('getting boxes in ' + cityState);

            // console.log('socket', socket)

            // if the socket has a 'cityState' code, and it has changed
            if (socket.cityState && socket.rooms.indexOf(cityState) === -1) {
                socket.leave(socket.cityState);
            }

            // set the cityState code of the boxes to the socket
            socket.cityState = cityState;

            debug('socket.cityState', socket.cityState)
            
            // have the socket join room who's name is the value of the cityState code for updates
            socket.join(cityState);
            debug('socket joining room ' + cityState);

            var city = cityState.split(', ')[0];
            var state = cityState.split(', ')[1];

            debug('city', city);
            debug('state', state);

            // build the boxes query
            var query = Box.model
                .where('location.address_components.administrative_area_level_1.short_name', state)
                .where('location.address_components.locality.short_name', city);

            if (tags.length > 0) {

                debug('tags specified!  querying for tags:', tags)

                query.where('tags').in(tags);
            }

            query.exec(gotBoxes);

        }

        function socketNewBox(newBox) {

            debug('newBox', newBox);

            // create a new Box
            var box = new Box.model(newBox);


            // save the box to the database
            box.save(function newBoxSaved(err, savedBox) {
                // if an error occurs, send it to our error handler
                if (err) {
                    dbError(err)
                }

                
                // if the box was saved successfully
                else {

                    debug('savedBox.cityState()', savedBox.cityState());

                    // tell all boxes in this box's city that a new box has been posted
                    self.io.in(savedBox.cityState()).emit('new-box', savedBox.toObject());
                }
            });       
        }

    }

    function serverListening () {
        self.emit('started');
    }

    function FreeboxFinderStarted () {

        console.log ("\n%s",String(banner).trim())

        console.log('\nFreeboxFinder server v' + self.env.version + ' started! >> %s', self.env.url(true));
    }

}

FreeboxFinder_Server.prototype = new events.EventEmitter();

FreeboxFinder_Server.prototype.start = function () {
    debug('Starting FreeboxFinder server...');

    this.emit('starting');

    mongoose.connect(this.config.mongodb.uri, this.config.mongodb.options); 

    return true;

}

FreeboxFinder_Server.prototype.stop = function (done) {
    var self = this;

    debug('Stopping FreeboxFinder server...');

    this.emit('stopping');

    this.io.emit('shutdown');

    this.server.close(function serverClosed () {
        self.connection.close()
        debug('FreeboxFinder server stopped!');
        self.emit('stopped');
        done();
    });

    for (var i = 0; i < self.clients.length; i++) {
        debug('client #' + i + ' destroyed');
        self.clients[i].destroy();
    }

    shutdownTimer = setTimeout(function shutdownTimeout() {
        debug('shutdown timeout!');
        self.emit('stopped');
        process.exit(); 
    }, self.config.shutdownTimeout);

}

module.exports = FreeboxFinder_Server;
