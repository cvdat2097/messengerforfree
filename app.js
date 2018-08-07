const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const helper = require('./lib/helper');

// Data
var onlineUsers = [];
var onlineSockets = {};
var xx;

app.use(express.static('public'));


io.on('connection', function (socket) {
    console.log('a user connected');
    socket.join('chatroom');

    var userID = helper.GenerateID();
    socket.emit('generateuserid', userID);

    socket.on('enternickname', function (nickname) {
        io.in('chatroom').emit('userjoined', nickname);

        onlineUsers.push({
            id: userID,
            nickname: nickname
        });
        onlineSockets[userID] = socket;

        io.in('chatroom').emit('newuseronline', onlineUsers);

        socket.on('disconnect', function () {
            console.log('user disconnected');
            onlineUsers = onlineUsers.filter(function (user) {
                return user.id != userID;
            });
            io.in('chatroom').emit('userleaved', nickname);
        });
    });

    socket.on('newmessagingrequest', function (remoteID, UserID) {
        if (onlineSockets[remoteID]) {
            onlineSockets[remoteID].emit('gotmessagingrequest', UserID);
        }
    });

    socket.on('seticecandidate', function (remoteID, candidate) {
        onlineSockets[remoteID].emit('goticecandidate', candidate);
    });

    socket.on('createoffer', function (remoteID, desc) {
        onlineSockets[remoteID].emit('gotoffer', desc, userID);
    });

    socket.on('createanswer', function (remoteID, desc) {
        onlineSockets[remoteID].emit('gotanswer', desc);
    });

    socket.on('connectionestablished', function (remoteID, userID) {
        onlineSockets[remoteID].emit('connectionestablished');
        onlineSockets[userID].emit('connectionestablished');
    })

});


http.listen(process.env.PORT || 3000, function (err) {
    if (!err) {
        console.log(`Server[${process.env.PORT || 3000}] is running...`);
    } else {
        console.log(err);
    }
})