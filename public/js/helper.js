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