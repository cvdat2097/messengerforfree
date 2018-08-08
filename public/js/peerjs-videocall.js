var localMediaStream;
var remoteMediaStream;
var localVideoPlayer = $('#caller-video');
var remoteVideoPlayer = $('#callee-video');


function RequestVideoCall(toUserID) {
    var call;

    console.log('Start Video call with' + toUserID);
    navigator.mediaDevices.getUserMedia({
        video: 1,
        audio: 1
    }).then(
        function (mediaStream) {
            console.log('Got local stream');
            console.log(mediaStream);
            localMediaStream = mediaStream;
            call = peer.call(toUserID, mediaStream);
            
            console.log('Set local player')
            $(localVideoPlayer).prop('srcObject', localMediaStream);

            call.on('stream', function (stream) {
                console.log('set remote player')
                console.log(stream)
                $(remoteVideoPlayer).prop('srcObject', stream);
            });
        }
    );
}

// Answer call
peer.on('call', function (call) {
    console.log('Incomming call...');

    navigator.mediaDevices.getUserMedia({
        video: 1,
        audio: 1
    }).then(
        function (mediaStream) {
            console.log('got local stream')
            console.log(mediaStream);
            localMediaStream = mediaStream;

            console.log('set local player')
            $(localVideoPlayer).prop('srcObject', localMediaStream);

            console.log('answer the call')
            call.answer(localMediaStream);


            call.on('stream', function (remoteStream) {
                console.log('set remote player')
                console.log(remoteStream);
                $(remoteVideoPlayer).prop('srcObject', remoteStream);
            });
        }
    );

});