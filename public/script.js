var socket = io();

messageText = document.getElementById('message-text');
nicknameText = document.getElementById('nickname-text');
conversatinBox = document.getElementById('conversation-box');

// Ask for nickname
var nickname = '';
do {
    nickname = prompt('What is your name?', 'MHX');
} while (!nickname)
nicknameText.innerHTML = 'Hello, ' + nickname;
socket.emit('enternickname', nickname);


socket.on('receivemessage', function (content) {
    conversatinBox.value += content.nickname + ': ' + content.message + '\n';
});

socket.on('userjoined', function (nickname) {
    conversatinBox.value += `<${nickname}> joined the room, welcome him/her now!\n`;
});
socket.on('userleaved', function (nickname) {
    conversatinBox.value += `<${nickname}> leaved the room, fuck off!\n`;
});

function SendMessage(e) {
    if (e.type != 'keydown' || e.key == 'Enter') {
        if (nicknameText.value == '') {
            window.alert('Please choose a nickname first');
        } else {
            var message = messageText.value;
            var nickname = nicknameText.value;

            socket.emit('sendmessage', message, nickname);
            messageText.value = '';
            conversatinBox.focus();
            conversatinBox.value += nickname + ': ' + message + '\n';
        }
    }
}

// Scroll to bottom
function ScrollToBottom() {
    console.log('kj')
}