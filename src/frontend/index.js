import * as WebcamApp from './WebcamApp.js'

let app;
let detection_threshold = 1;
let detections = 0;
let videoInputs = [];


const settingInputs = {
  scoreSlider:  document.getElementById('score-slider'),
  refreshTimeSlider: document.getElementById('refreshtime-slider'),
  thresholdSlider: document.getElementById('threshold-slider'),
  applyButton: document.getElementById('settings-face-detection-apply-button'),
  obsConnectButton: document.getElementById('settings-obs-connect-button'),
  obsIpField: document.getElementById('obs-ip-input'),
  obsPortField: document.getElementById('obs-port-input'),
  obsPasswordField: document.getElementById('obs-password-input'),
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

  window.electronAPI.handleObsConnectionError((event, message) => {
    console.log(message);
    alert(message);
  });

  window.electronAPI.handleCacheSettingsInit((event, settings) => {
    console.log('index.js!!');
    console.log(settings);
    settingInputs.obsIpField.value = settings.obs.ip;
    settingInputs.obsPortField.value = settings.obs.port;
    settingInputs.obsPasswordField.value = settings.obs.password;
    // TODO: face settings
  });

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

function applyFaceSettings() {
  /*app.detectionMinScore = parseFloat(settingInputs.scoreSlider.value);
  app.detectionRefreshTime = parseInt(settingInputs.refreshTimeSlider.value);
  detection_threshold = parseInt(settingInputs.thresholdSlider);*/
}

function getObsConnectionSettings() {
  return {
    ip: settingInputs.obsIpField.value,
    port: settingInputs.obsPortField.value,
    password: settingInputs.obsPasswordField.value,
  };
}

settingInputs.applyButton.onclick = function () {
  console.log("apply clicked!");
  applyFaceSettings();
};

settingInputs.obsConnectButton.onclick = function () {
  let settings = getObsConnectionSettings();
  window.electronAPI.sendObsConnectionSettings(settings);
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
