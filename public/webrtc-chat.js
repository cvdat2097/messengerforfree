var socket = io();

messageText = $('#message-text');
conversatinBox = $('#conversation-box');
userList = $('#online-users ul');
nicknameText = $('#nickname-text');
remoteNicknameText = $('#remote-nickname');

// Ask for nickname
var nickname = '';
var userID = '';
var RTCConnection;
var MessagingChannel;

while (!nickname) {
    nickname = prompt('What is your name?', 'MHX');
}
socket.emit('enternickname', nickname);
$(nicknameText).text('Hello, ' + nickname)

socket.on('generateuserid', function (id) {
    userID = id;
    console.log(userID);
});


socket.on('receivemessage', function (content) {
    AppendMessage(content.nickname + ': ' + content.message);
});

socket.on('userjoined', function (nickname) {
    AppendMessage(`<${nickname}> is online!`);

});

socket.on('newuseronline', function (onlineUsers) {
    $(userList).empty();
    for (var user of onlineUsers) {
        if (user.id != userID) {
            $(userList).append(`<li onclick="RequestMessenger('${user.id}')" id="user-${user.nickname.replace(/[\s]/g, "")}"><a href="#">${user.nickname}</a></li>`);
        }
    }
});

socket.on('userleaved', function (nickname) {
    AppendMessage(`<${nickname}> disconnected.`);
    nickname = nickname.replace(/[\s]/g, "");
    $(`#user-${nickname}`).remove();
});

socket.on('gotmessagingrequest', function (userID) {
    console.log(`Got messaging request from ${userID}`);
    ResponseMessenger(userID);
});

socket.on('connectionestablished', function () {
    $(messageText).prop('disabled', false).focus();
})

function RequestMessenger(remoteID) {
    console.log(`Start messaging with: ${remoteID}`);
    socket.emit('newmessagingrequest', remoteID, userID);

    RTCConnection = new RTCPeerConnection();

    socket.on('goticecandidate', function (candidate) {
        if (candidate) {
            RTCConnection.addIceCandidate(candidate);
        }
    });

    RTCConnection.onicecandidate = function (event) {
        socket.emit('seticecandidate', remoteID, event.candidate);
    }

    MessagingChannel = RTCConnection.createDataChannel('messaging');
    MessagingChannel.onmessage = function (event) {
        let content = JSON.parse(event.data);
        AppendMessage(`${content.nickname}: ${content.message}`);
    }

    RTCConnection.createOffer().then(
        function (desc) {
            RTCConnection.setLocalDescription(desc);
            socket.emit('createoffer', remoteID, desc);

            socket.on('gotanswer', function (desc) {
                if (desc) {
                    RTCConnection.setRemoteDescription(desc);
                    socket.emit('connectionestablished', remoteID, userID);
                }
            })
        }
    );
}

function ResponseMessenger(localID) {
    RTCConnection = new RTCPeerConnection();
    RTCConnection.onicecandidate = function (event) {
        socket.emit('seticecandidate', localID, event.candidate);
    }

    socket.on('goticecandidate', function (candidate) {

        if (candidate) {
            RTCConnection.addIceCandidate(candidate);
        }
    });

    RTCConnection.ondatachannel = function (event) {
        MessagingChannel = event.channel;
        MessagingChannel.onmessage = function (event) {
            let content = JSON.parse(event.data);
            AppendMessage(`${content.nickname}: ${content.message}`);
        }
    }

    socket.on('gotoffer', function (desc, fromUserID) {
        RTCConnection.setRemoteDescription(desc);

        RTCConnection.createAnswer().then(
            function (desc) {
                RTCConnection.setLocalDescription(desc);
                socket.emit('createanswer', fromUserID, desc);
            }
        );
    })
}

function SendMessage(e) {
    if (e.type != 'keydown' || e.key == 'Enter') {
        if (nickname == '') {
            window.alert('Please choose a nickname first');
        } else {
            let message = $(messageText).val();;
            if (message != '' && MessagingChannel) {
                MessagingChannel.send(JSON.stringify({
                    nickname: nickname,
                    message: message
                }));

                $(messageText).val('').focus();
            }
        }
    }
}

function AppendMessage(msg) {
    $(conversatinBox).val($(conversatinBox).val() + msg + '\n');
}