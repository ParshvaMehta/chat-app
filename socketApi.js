var socket_io = require('socket.io');
var io = socket_io();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var groupChat = mongoose.model('groupChat');
var socketApi = {};

socketApi.io = io;
io.on('connection', function(socket) {
    console.log('A user connected');
    socket.on('send_msg', function(msg) {
        console.info(msg);
        User.findById(msg.user_id, function(err, user) {
            if (err)
                socketApi.sendNotification({ message: 'something went wrong', status: '500' });
            if (user) {
                var group_chat = new groupChat();
                group_chat.user_id = msg.user_id;
                group_chat.msg = msg.msg;
                group_chat.save(function(err) {
                    if (err) {
                        console.log('Error in Saving playlist: ' + err);
                        socketApi.sendNotification({ message: 'something went wrong', status: '500' });
                    }
                    var usrchat = {};
                    usrchat.msg = msg.msg;
                    // usrchat.username = user.username;
                    usrchat._id = group_chat._id;
                    usrchat.user_id = {
                        "username": user.username,
                        "_id": msg.user_id
                    };
                    socketApi.sendNotification(usrchat);
                });
            }
        });
    });
});

io.on('disconnect', function() {
    console.log('user disconnected');
});

socketApi.sendNotification = function(msg) {
    console.info(msg);
    io.sockets.emit('broadcast', msg);
}

module.exports = socketApi;
