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

    var userID = helper.GenerateID();
    socket.emit('generateuserid', userID);

    socket.on('enternickname', function (nickname) {
        socket.to('chatroom').emit('userjoined', nickname);

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
            socket.to('chatroom').emit('userleaved', nickname);
        });
    });

    socket.on('newmessagingrequest', function (toUserID, fromUserID) {
        if (onlineSockets[toUserID]) {
            onlineSockets[toUserID].emit('gotmessagingrequest', fromUserID);
        }
    });
    socket.on('newvideocallrequest', function (toUserID, fromUserID) {
        if (onlineSockets[toUserID]) {
            onlineSockets[toUserID].emit('gotvideocallrequest', fromUserID);
        }
    });

    socket.on('seticecandidate', function (toUserID, IceCandidate) {
        if (onlineSockets[toUserID]) {
            onlineSockets[toUserID].emit('goticecandidate', IceCandidate);
        }
    });

    socket.on('createoffer', function (toUserID, desc) {
        if (onlineSockets[toUserID]) {
            onlineSockets[toUserID].emit('gotoffer', desc, userID);
        }
    });

    socket.on('createanswer', function (toUserID, desc) {
        if (onlineSockets[toUserID]) {
            onlineSockets[toUserID].emit('gotanswer', desc);
        }
    });

    socket.on('connectionestablished', function (remoteID, userID) {
        onlineSockets[remoteID].emit('connectionestablished', onlineUsers
            .filter(function (user) { return user.id == userID; })[0]
            .nickname);
        onlineSockets[userID].emit('connectionestablished', onlineUsers
            .filter(function (user) { return user.id == remoteID; })[0]
            .nickname);
    });
});


http.listen(process.env.PORT || 3000, function (err) {
    if (!err) {
        console.log(`Server[${process.env.PORT || 3000}] is running...`);
    } else {
        console.log(err);
    }
});