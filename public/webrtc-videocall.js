var callerVideoPlayer = $('#caller-video');
var calleeVideoPlayer = $('#callee-video');


var callerVideoStream;
var calleeVideoStream;

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

    RTCConnection = new RTCPeerConnection();

    navigator.mediaDevices.getUserMedia({
        video: 1,
        audio: 1
    }).then(
        function (mediaStream) {
            callerVideoStream = mediaStream;
            $(callerVideoPlayer).prop('srcObject', mediaStream);

            callerVideoStream.getTracks().forEach(
                track => {
                    RTCConnection.addTrack(track, callerVideoStream);
                }
            );

            socket.on('goticecandidate', function (candidate) {
                if (candidate) {
                    RTCConnection.addIceCandidate(candidate);
                }
            });

            RTCConnection.onicecandidate = function (event) {
                socket.emit('seticecandidate', toUserID, event.candidate);
            }

            RTCConnection.ontrack = function (event) {
                console.log('OKKKKKK')
                $(calleeVideoPlayer).prop('srcObject', event.streams[0]);
            }

            RTCConnection.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            }).then(
                function (desc) {
                    RTCConnection.setLocalDescription(desc);
                    socket.emit('createoffer', toUserID, desc);

                    socket.on('gotanswer', function (desc) {
                        if (desc) {
                            RTCConnection.setRemoteDescription(desc);
                            socket.emit('connectionestablished', toUserID, userID);
                        }
                    })
                }
            );
        }
    );
}

function ResponseVideoCall(fromUserID) {
    RTCConnection = new RTCPeerConnection();
    RTCConnection.onicecandidate = function (event) {
        socket.emit('seticecandidate', fromUserID, event.candidate);
    }

    socket.on('goticecandidate', function (candidate) {
        if (candidate) {
            RTCConnection.addIceCandidate(candidate);
        }
    });

    RTCConnection.ontrack = function (event) {
        $(calleeVideoPlayer).prop('srcObject', event.streams[0]);
    }

    socket.on('gotoffer', function (desc, fromUserID) {
        RTCConnection.setRemoteDescription(desc);

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(
            function (mediaStream) {
                $(callerVideoPlayer).prop('srcObject', mediaStream);

                calleeMediaStream = mediaStream;
                calleeMediaStream.getTracks().forEach(
                    track => {
                        RTCConnection.addTrack(track, calleeMediaStream);
                    }
                );

                RTCConnection.createAnswer().then(
                    function (desc) {
                        RTCConnection.setLocalDescription(desc);
                        socket.emit('createanswer', fromUserID, desc);
                    }
                );
            }
        );
    })
}

function CloseVideoCall() {
    console.log('CLose')
    RTCConnection.close();
    RTCConnection = null;

    callerVideoStream.getTracks().forEach(track => { track.stop() });
    calleeVideoStream.getTracks().forEach(track => { track.stop() });

    $(callerVideoStream).prop('srcObject', null);
    $(calleeVideoStream).prop('srcObject', null);
}