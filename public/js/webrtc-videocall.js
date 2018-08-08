var callerVideoPlayer = $('#caller-video');
var calleeVideoPlayer = $('#callee-video');


var callerVideoStream;
var calleeVideoStream;

var VideoRTCConnection;

socket.on('gotvideocallrequest', function (fromUserID) {
    console.log(`Got videocall request from ${fromUserID}`);
    ResponseVideoCall(fromUserID);
});

function RequestVideoCall(toUserID) {
    $(videocallPanel).css('display', 'grid');
    $(chatPanel).css('display', 'none');

    console.log(`Video Call request to ${toUserID} `);
    CloseMessenger();
    socket.emit('newvideocallrequest', toUserID, userID);

    VideoRTCConnection = new RTCPeerConnection(rtcConfiguration);

    navigator.mediaDevices.getUserMedia({
        video: 1,
        audio: 1
    }).then(
        function (mediaStream) {
            callerVideoStream = mediaStream;
            $(callerVideoPlayer).prop('srcObject', mediaStream);

            callerVideoStream.getTracks().forEach(
                track => {
                    VideoRTCConnection.addTrack(track, callerVideoStream);
                }
            );

            socket.on('goticecandidate', function (candidate) {
                if (candidate) {
                    VideoRTCConnection.addIceCandidate(candidate);
                }
            });

            VideoRTCConnection.onicecandidate = function (event) {
                socket.emit('seticecandidate', toUserID, event.candidate);
            }

            VideoRTCConnection.ontrack = function (event) {
                console.log('OKKKKKK')
                $(calleeVideoPlayer).prop('srcObject', event.streams[0]);
            }

            VideoRTCConnection.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            }).then(
                function (desc) {
                    VideoRTCConnection.setLocalDescription(desc);
                    socket.emit('createoffer', toUserID, desc);

                    socket.on('gotanswer', function (desc) {
                        if (desc) {
                            VideoRTCConnection.setRemoteDescription(desc);
                            socket.emit('connectionestablished', toUserID, userID);
                        }
                    })
                }
            );
        }
    );
}

function ResponseVideoCall(fromUserID) {
    VideoRTCConnection = new RTCPeerConnection(rtcConfiguration);
    VideoRTCConnection.onicecandidate = function (event) {
        socket.emit('seticecandidate', fromUserID, event.candidate);
    }

    socket.on('goticecandidate', function (candidate) {
        if (candidate) {
            VideoRTCConnection.addIceCandidate(candidate);
        }
    });

    VideoRTCConnection.ontrack = function (event) {
        $(calleeVideoPlayer).prop('srcObject', event.streams[0]);
    }

    socket.on('gotoffer', function (desc, fromUserID) {
        VideoRTCConnection.setRemoteDescription(desc);

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(
            function (mediaStream) {
                $(callerVideoPlayer).prop('srcObject', mediaStream);

                calleeMediaStream = mediaStream;
                calleeMediaStream.getTracks().forEach(
                    track => {
                        VideoRTCConnection.addTrack(track, calleeMediaStream);
                    }
                );

                VideoRTCConnection.createAnswer().then(
                    function (desc) {
                        VideoRTCConnection.setLocalDescription(desc);
                        socket.emit('createanswer', fromUserID, desc);
                    }
                );
            }
        );
    })
}

function CloseVideoCall() {
    console.log('CLose')
    VideoRTCConnection.close();
    VideoRTCConnection = null;

    callerVideoStream.getTracks().forEach(track => { track.stop() });
    calleeVideoStream.getTracks().forEach(track => { track.stop() });

    $(callerVideoStream).prop('srcObject', null);
    $(calleeVideoStream).prop('srcObject', null);
}