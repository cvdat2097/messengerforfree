var peer = new Peer();
var socket = new io();
var peerConnection;

var videocallPanel = $('.videocall-container');
var chatPanel = $('.chat-container');

messageText = $('#message-text');
conversationBox = $('#conversation-box');
userList = $('#online-users ul');
nicknameText = $('#nickname-text');
remoteNicknameText = $('.remote-nickname-text');

var nickname = '';
var userID = '';
// Ask for nickname
nickname = prompt('What is your name?', 'MHX');
if (!nickname) {
    nickname = 'Tester';
}
$(nicknameText).append(`Hello, <b><i>${nickname}</i></b>.`);

// Main
peer.on('open', function (id) {
    userID = id;
    console.log(userID);
    socket.emit('infoGenerated', nickname, userID);
});

// Notify all people
socket.on('userJoined', function (nickname) {
    AppendMessage(`${nickname} is online!`, false, true);
});

// Update online list
socket.on('newUserOnline', function (onlineUsers) {
    $(userList).empty();
    for (var user of onlineUsers) {
        if (user.id != userID) {
            $(userList).append(
                `<li id="user-${user.nickname.replace(/[\s]/g, "")}">
                    <div>
                    <p>${user.nickname} </p>
                    <span class="online-dot"></span>
                    </div>
                    <div>
                    <i class="material-icons action-link" onclick="RequestMessenger('${user.id}')" style="color: rgb(0, 189, 0)">chat_bubble</i>
                    <i class="material-icons action-link" onclick="RequestVideoCall('${user.id}')" style="color: dodgerblue">voice_chat</i>
                    </div>
                </li>`
            );
        }
    }
});

// Notify all people
socket.on('userLeaved', function (nickname) {
    AppendMessage(`${nickname} disconnected.`, false, true);
    nickname = nickname.replace(/[\s]/g, "");
    $(`#user-${nickname}`).remove();
});

// Receive data
peer.on('connection', function (conn) {
    peerConnection = conn;
    console.log(`peerConnection:  ${peerConnection}`);
    peerConnection.on('data', function (data) {
        // Receive data
        AppendMessage(data.message);
    });

    $(messageText).prop('disabled', false).focus();
    $(remoteNicknameText).text(peerConnection.peer);
});

function RequestMessenger(toUserID) {
    console.log(`Start messaging with: ${toUserID}`);

    peerConnection = peer.connect(toUserID);
    peerConnection.on('open', function () {
        peerConnection.on('data', function (data) {
            // Receive data
            AppendMessage(data.message);
        });

        console.log('Connection ID: ' + peerConnection.id);

        $(messageText).prop('disabled', false).focus();
        $(remoteNicknameText).text(toUserID);
        console.log('Success')
    });
}

function SendMessage(e) {
    if (e.type != 'keydown' || e.key == 'Enter') {
        if (nickname == '') {
            window.alert('Please choose a nickname first');
        } else {
            let message = $(messageText).val();
            if (message != '' && peerConnection) {
                AppendMessage(message, true);

                peerConnection.send({
                    nickname: nickname,
                    message: message
                });

                $(messageText).val('').focus();
            }
        }
    }
}