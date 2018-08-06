const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));


io.on('connection', function (socket) {
    console.log('a user connected');
    socket.join('chatroom');

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });

    socket.on('sendmessage', function (message, nickname) {
        io.in('chatroom').emit('receivemessage', {
            message: message,
            nickname: nickname
        })
    })
});


http.listen(process.env.PORT || 3000, function (err) {
    if (!err) {
        console.log(`Server[${process.env.PORT || 3000}] is running...`);
    } else {
        console.log(err);
    }
})