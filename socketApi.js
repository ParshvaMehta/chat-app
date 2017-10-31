var socket_io = require('socket.io');
var io = socket_io();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var groupChat = mongoose.model('groupChat');
var OnlineUser = mongoose.model('OnlineUser');
var socketApi = {};
var onlineUserArr = [];
socketApi.io = io;
io.on('connection', function(socket) {
    console.log('A user connected');
    if (onlineUserArr.indexOf(socket.id) < 0) {
        onlineUserArr.push(socket.id);
    }
    socket.on('send_msg', function(msg) {
    	console.log(msg);
        User.findById(msg.user_id, function(err, user) {
            if (err)
                socketApi.sendNotification({ message: 'something went wrong', status: '500' });
            console.log(user);
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
                        "_id": msg.user_id,
                        "user_role": msg.user_role,
                        "avtar": user.avtar
                    };
                    socketApi.sendNotification(usrchat);
                });
            }
        });
    });
    socket.on('userGetsOnlineServerAck', function(onlineUserData) {
        OnlineUser.find({ socket_id: onlineUserData.socket_id }, function(err, onlineuser) {
            if (err)
                console.log('error in fetching the online_user!');
            if (!onlineuser || onlineuser.length < 0) {
                var online_user = new OnlineUser();
                online_user.user_id = onlineUserData._id;
                online_user.username = onlineUserData.username;
                online_user.user_role = onlineUserData.user_role;
                online_user.socket_id = onlineUserData.socket_id;
                online_user.avtar = onlineUserData.avtar;
                online_user.save(function(err) {
                    socketApi.sendNotificationWithAlert('userGetsOnlineClientAck', onlineUserData);
                });
            }
        });
    });
    socket.on('disconnect', function() {
        console.log(socket.id);
        var socket_id = socket.id;
        onlineUserArr.splice(onlineUserArr.indexOf(socket_id), 1);
        //setTimeout(function() {
        // if (onlineUserArr.indexOf(socket_id) < 0) {
        OnlineUser.find({ socket_id: socket_id }).remove().exec(function(err) {
            if (err)
                console.log('error in removing the online_user!');
        });
        // }
        //}, 10000);
    });
});

io.on('disconnect', function() {
    console.log('user disconnected');
});

socketApi.sendNotification = function(msg) {
    console.info(msg);
    io.sockets.emit('broadcast', msg);
}

socketApi.sendNotificationWithAlert = function(alert, msg) {
    io.sockets.emit(alert, msg);
}

module.exports = socketApi;