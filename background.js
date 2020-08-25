var receiver = null;

chrome.browserAction.onClicked.addListener(buttonClicked);

function buttonClicked(tab) {
  getMediaStreamId();
}

function getMediaStreamId() {
  chrome.tabCapture.getMediaStreamId(function(streamId) {
    if (typeof streamId !== 'string') {
      console.error('Failed to get media stream id: ' +
                    (chrome.runtime.lastError.message || 'UNKNOWN'));
      return;
    }

    navigator.webkitGetUserMedia({
      audio: {
        mandatory:{
          chromeMediaSource:'tab',
          chromeMediaSourceId:streamId
        }
      },
      video: false
    },
    function(stream){
      startVisualizer(stream);
    },
    function(error){
      console.error(error);
    })
  });
}

// Open a new window of receiver.html when browser action icon is clicked.
function startVisualizer(stream) {
  if (!stream) {
    console.error('Error starting tab capture: ' +
                  (chrome.runtime.lastError.message || 'UNKNOWN'));
    return;
  }
  if (receiver != null) {
    receiver.close();
  }
  receiver = window.open('visualizer.html');
  receiver.currentStream = stream;
}
