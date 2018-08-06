messageText = document.getElementById('message-text');
nicknameText = document.getElementById('nickname-text');
conversatinBox = document.getElementById('conversation-box');

socket.on('receivemessage', function (content) {
    conversatinBox.value += content.nickname + ': ' + content.message + '\n';
})

function SendMessage(e) {
    if (e.type != 'keydown' || e.key == 'Enter') {
        var message = messageText.value;
        var nickname = nicknameText.value;

        socket.emit('sendmessage', message, nickname);
        messageText.value = '';
        conversatinBox.focus();
    }
}