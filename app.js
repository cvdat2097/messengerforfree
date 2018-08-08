const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const helper = require('./lib/helper');

// Data
var onlineUsers = [];
var onlineSockets = {};

app.use(express.static('public'));


io.on('connection', function (socket) {
    console.log('a user connected');
    
    socket.join('chatroom');

    var userID;
    socket.on('infoGenerated', function (nickname, id) {
        console.log('Got info of new user');
        socket.to('chatroom').emit('userJoined', nickname);
        userID = id;

        onlineUsers.push({
            id: userID,
            nickname: nickname
        });
        onlineSockets[userID] = socket;

        console.log('Send onlineUsers')
        io.in('chatroom').emit('newUserOnline', onlineUsers);

        socket.on('disconnect', function () {
            console.log('user disconnected');
            onlineUsers = onlineUsers.filter(function (user) {
                return user.id != userID;
            });
            socket.to('chatroom').emit('userLeaved', nickname);
        });
    });
});


http.listen(process.env.PORT || 3000, function (err) {
    if (!err) {
        console.log(`Server[${process.env.PORT || 3000}] is running...`);
    } else {
        console.log(err);
    }
});