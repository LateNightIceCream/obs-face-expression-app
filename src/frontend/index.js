import * as WebcamApp from './WebcamApp.js'

let app;
let detection_threshold = 1;
let detections = 0;
let videoInputs = [];


const settingInputs = {
  scoreSlider:  document.getElementById('score-slider'),
  refreshTimeSlider: document.getElementById('refreshtime-slider'),
  thresholdSlider: document.getElementById('threshold-slider'),
  applyButton: document.getElementById('settings-apply-button'),
  webcamDropDown: document.getElementById('webcam-dropdown'),
  webcamList: document.getElementById('webcam-list'),
}

async function main() {

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  if (!video || !canvas) return null;

  videoInputs = await enumerateVideoDevices();
  //app.setVideoDeviceId(videoInputs[0].deviceId);

  app = new WebcamApp.WebcamApp(video, canvas);

  await app.initialize();

  app.cameraDimensions = { x: 400, y: 200 };



  /*video.oncanplay = function () {
    app.pause();
  };*/
}

async function enumerateVideoDevices() {
  let devices = await navigator.mediaDevices.enumerateDevices();
  devices = devices.filter( (device) => {
    if (device.kind === 'videoinput') {
      return device;
    }
  });
  return devices;
}

function onWebcamSelected (device) {
  return () => {
    console.log(device.deviceId);
    app.setVideoDeviceId(device.deviceId);
  };
}

async function loadWebcamDropDown () {
  let devices = await enumerateVideoDevices();
  console.log(devices);
  clearList(settingInputs.webcamList);
  devices.forEach((device) => {
    let description = device.label;
    addWebcamToDropDown(settingInputs.webcamList, description, onWebcamSelected(device));
  });
}

function addWebcamToDropDown(element, description, onclickCallback) {
  let item = document.createElement('li');
  let link = document.createElement('a');
  link.onclick = onclickCallback;
  link.innerHTML = description;
  item.appendChild(link);
  element.appendChild(item);
}

function clearList(element) {
  while(element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function applySettings() {
  app.detectionMinScore = parseFloat(this.value);
  app.detectionRefreshTime = parseInt(this.value);
  // ipc communicate
}

settingInputs.applyButton.onclick = function () {
  applySettings();
};

settingInputs.webcamDropDown.onclick = function () {
  loadWebcamDropDown();
};

document.addEventListener('expression-changed', () => { // TODO: pass the expression with the event somehow
  detections += 1
  if (detections >= detection_threshold) {
    // TODO: ipc communicate with main
    let expression = app.previousExpression; // see TODO above
    window.electronAPI.sendExpression(expression);
    detections = 0;
  }
});

// start processing as soon as page is loaded
window.onload = main;
