var socket_io = require('socket.io');
var io = socket_io();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var groupChat = mongoose.model('groupChat');
var socketApi = {};

socketApi.io = io;

io.on('connection', function(socket) {
    console.log('A user connected');
});

io.on('disconnect', function() {
    console.log('user disconnected');
});

socketApi.sendNotification = function() {
    io.sockets.emit('hello', { msg: 'Hello World!' });
}

module.exports = socketApi;
