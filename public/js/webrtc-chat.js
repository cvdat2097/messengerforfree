var socket = io();

var videocallPanel = $('.videocall-container');
var chatPanel = $('.chat-container');

messageText = $('#message-text');
conversationBox = $('#conversation-box');
userList = $('#online-users ul');
nicknameText = $('#nickname-text');
remoteNicknameText = $('.remote-nickname-text');

var nickname = '';
var userID = '';
var RTCConnection;
var MessagingChannel;
var rtcConfiguration = {
    'iceServers': [
        {
            'urls': 'stun:stun.l.google.com:19302'
        }
    ]
}


// Ask for nickname
while (!nickname) {
    nickname = prompt('What is your name?', 'MHX');
}
socket.emit('enternickname', nickname);
$(nicknameText).append(`Hello, <b><i>${nickname}</i></b>.`)

// Get UserID of the current browser session
socket.on('generateuserid', function (newUserID) {
    userID = newUserID;
    console.log(userID);
});

// Notify all people
socket.on('userjoined', function (nickname) {
    AppendMessage(`${nickname} is online!`, false, true);
});

// Update online list
socket.on('newuseronline', function (onlineUsers) {
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
socket.on('userleaved', function (nickname) {
    AppendMessage(`${nickname} disconnected.`, false, true);
    nickname = nickname.replace(/[\s]/g, "");
    $(`#user-${nickname}`).remove();
});

socket.on('gotmessagingrequest', function (fromUserID) {
    console.log(`Got messaging request from ${fromUserID}`);
    ResponseMessenger(fromUserID);
});

socket.on('connectionestablished', function (chatWithNickname) {
    $(messageText).prop('disabled', false).focus();
    $(remoteNicknameText).text(chatWithNickname);
    console.log('Success')
});

function RequestMessenger(toUserID) {
    CloseMessenger();

    $(videocallPanel).css('display', 'none');
    $(chatPanel).css('display', 'grid');

    console.log(`Start messaging with: ${toUserID}`);
    socket.emit('newmessagingrequest', toUserID, userID);

    RTCConnection = new RTCPeerConnection(rtcConfiguration);

    socket.on('goticecandidate', function (candidate) {
        if (candidate) {
            RTCConnection.addIceCandidate(candidate);
        }
    });

    RTCConnection.onicecandidate = function (event) {
        socket.emit('seticecandidate', toUserID, event.candidate);
    }


    MessagingChannel = RTCConnection.createDataChannel('messaging');
    MessagingChannel.onmessage = function (event) {
        let content = JSON.parse(event.data);
        AppendMessage(content.message);
    }


    RTCConnection.createOffer().then(
        function (desc) {
            console.log('Cereating offer...');
            RTCConnection.setLocalDescription(desc);
            socket.emit('createoffer', toUserID, desc);

            socket.on('gotanswer', function (desc) {
                if (desc) {
                    console.log('Got answer')
                    RTCConnection.setRemoteDescription(desc);
                    socket.emit('connectionestablished', toUserID, userID);
                }
            })
        }
    ).catch(function (e) { console.log('ERR !!!!!!!!!!!', e) });

}

function ResponseMessenger(fromUserID) {
    CloseMessenger();

    RTCConnection = new RTCPeerConnection(rtcConfiguration);

    RTCConnection.onicecandidate = function (event) {
        socket.emit('seticecandidate', fromUserID, event.candidate);
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
            AppendMessage(content.message);
        }
    }

    socket.on('gotoffer', function (desc, fromUserID) {
        RTCConnection.setRemoteDescription(desc);
        console.log('Got offer...   ')
        RTCConnection.createAnswer().then(
            function (desc) {
                RTCConnection.setLocalDescription(desc);
                socket.emit('createanswer', fromUserID, desc);
            }
        );
    });

}

function CloseMessenger() {
    if (MessagingChannel) {
        console.log('Closing...')
        MessagingChannel.close();
        MessagingChannel = null;
    }

    if (RTCConnection) {
        console.log('RTC is closing...')
        RTCConnection.close();
        RTCConnection = null;
    }

    $(conversationBox).empty();
    $(messageText).prop('disabled', true);
}

function SendMessage(e) {
    if (e.type != 'keydown' || e.key == 'Enter') {
        if (nickname == '') {
            window.alert('Please choose a nickname first');
        } else {
            let message = $(messageText).val();
            if (message != '' && MessagingChannel) {
                AppendMessage(message, true);
                MessagingChannel.send(JSON.stringify({
                    nickname: nickname,
                    message: message
                }));
                $(messageText).val('').focus();
            }
        }
    }
}

function AppendMessage(msg, fromSender = false, isNotification = false) {
    if (isNotification) {
        $(conversationBox).append(
            `<div class="conversation-message notification">
            <span class="message message-notification">${msg}</span>
            </div>`
        );
    } else if (fromSender) {
        $(conversationBox).append(
            `<div class="conversation-message from-sender">
            <span class="message message-from-sender">${msg}</span>
            </div>`
        );
    } else {
        $(conversationBox).append(
            `<div class="conversation-message">
            <span class="message">${msg}</span>
            </div>`
        );
    }
    $(conversationBox).scrollTop(1000);
}

function SelectMode(mode) {
    if (mode === 'chat') {
        $(videocallPanel).css('display', 'none');
        $(chatPanel).css('display', 'grid');
    } else if (mode === 'videocall') {
        $(videocallPanel).css('display', 'grid');
        $(chatPanel).css('display', 'none');
    }
}