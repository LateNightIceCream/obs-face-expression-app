import * as WebcamApp from './WebcamApp.js'
import * as DropDown from './DropDown.js'

let app;
let detectionThreshold = 1;
let videoInputs = [];
let webcamDropDown;

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
};

async function main() {

  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  if (!video || !canvas) return null;

  videoInputs = await enumerateVideoDevices();

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

  webcamDropDown = new DropDown.DropDown('webcam-dropdown');
  webcamDropDown.parent.onclick = onWebcamDropDownClicked;
  webcamDropDown.onItemSelected = onWebcamDropDownItemSelected;

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

function applyFaceSettings() {
  app.detectionMinScore = parseFloat(settingInputs.scoreSlider.value);
  app.detectionRefreshTime = parseInt(settingInputs.refreshTimeSlider.value);
  detectionThreshold = parseInt(settingInputs.thresholdSlider.value);
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

document.addEventListener('expression-changed', () => {
});

document.addEventListener('expression-detected', () => {
  if (app.currentExpressionDetectionCount == detectionThreshold) {
    let expression = app.previousExpression;
    window.electronAPI.sendExpression(expression);
  }
});

async function onWebcamDropDownClicked () {
  console.log('hello!');
  enumerateVideoDevices()
  .then((devices) => {
    devices.forEach((device) => {
      webcamDropDown.clearChildren();
      webcamDropDown.addChild(device.label, device);
    });
  })
  .catch((error) => {
    console.log(error);
  });
}

function onWebcamDropDownItemSelected(item) {
  console.log(item);
  app.setVideoDeviceId(item.deviceId);
}

// start processing as soon as page is loaded
window.onload = main;
