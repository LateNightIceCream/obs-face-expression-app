import * as faceapi from './faceapi/dist/face-api.esm.js'
import * as util from './util.js'

export class WebcamApp {
  constructor (video, canvas) {
    this.options = {
      modelPath:'../../model/',
      minScore: 0.5,
      refreshTime: 333,
      optionsSSDMobileNet: null,
      camera: {
        width: 512,
        height: 256,
      },
    }
    this.video = video;
    this.canvas = canvas;
    this.videoDeviceId = null;

    this.previousExpression = null;
    this.currentExpressionDetectionCount = 0;
    this.expressionChangedEvent = new CustomEvent('expression-changed');
    this.expressionDetectedEvent = new CustomEvent('expression-detected');
  }

  initialize() {
    this._setupFaceAPI();
    this._setupCamera();
    this._setupVideoPauseOnClick();
  }

  pause() {
    if (!this.isVideoReady()) {
      return;
    }
    this.video.pause();
  }

  resume() {
    if (!this.isVideoReady()) {
      return;
    }
    this.video.play();
    this.detectVideo();
  }

  isVideoReady() {
    return this.video && this.video.readyState >= 2;
  }

  set detectionMinScore(score) {
    this.options.minScore = score;
    this.options.optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
      minConfidence: this.options.minScore
    });
  }

  set detectionRefreshTime(time_ms) {
    this.options.refreshTime = time_ms;
  }

  set detectionFps(fps) {
    this.options.refreshTime = 1 / fps * 1000;
  }

  set cameraDimensions(dim) {
    this.options.camera.width = dim.x;
    this.options.camera.height = dim.y;
    this._setupCamera();
  }
}

WebcamApp.prototype.setVideoDeviceId = async function (deviceId) {
  this.videoDeviceId = deviceId;
  this.initialize();
};


WebcamApp.prototype._setupFaceAPI = async function () {
  try {
    await faceapi.tf.setBackend('webgl');
    await faceapi.tf.enableProdMode();
    await faceapi.tf.ENV.set('DEBUG', false);
    await faceapi.tf.ready();
    await faceapi.nets.ssdMobilenetv1.load(this.options.modelPath);
    await faceapi.nets.faceExpressionNet.load(this.options.modelPath);
    this.options.optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({
      minConfidence: this.options.minScore
    });
  }
  catch(err) {
    util.log('error while setting up faceapi');
    util.log(err);
  }
  console.log(`Models loaded: ${faceapi.tf.engine().state.numTensors} tensors`);
};


WebcamApp.prototype._setupCanvas = function () {
  //let videoBoundingRect = this.video.getBoundingClientRect();
  this.canvas.style.width = this.options.camera.width;
  this.canvas.style.height = this.options.camera.height;
};


WebcamApp.prototype._setupCamera = async function () {
  util.log('Setting up camera');

  if (!navigator.mediaDevices) {
    util.log('Camera Error: access not supported');
    return null;
  }

  let stream = await this._getCameraStream({
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: this.options.camera.width },
      height: { ideal: this.options.camera.height },
      deviceId: this.videoDeviceId,
    }
  });

  if (!stream) {
    util.log('Camera Error: stream empty');
    return null;
  }

  video.srcObject = stream;

  this._setupCanvas();
  util.logStreamSettings(stream);

  return new Promise((resolve) => {
    video.onloadeddata = async () => {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.video.play();
      this.detectVideo();
      resolve(true);
    };
  });
};


WebcamApp.prototype._getCameraStream = async function (constraints) {
  let stream;
  let msg = '';
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  }
  catch (err) {
    if (err.name === 'PermissionDeniedError' ||
        err.name === 'NotAllowedError') {
      msg = 'camera permission denied';
    }
    else if (err.name === 'SourceUnavailableError') {
      msg = 'camera not available';
    }
    util.log(`Camera Error: ${msg}: ${err.message || err}`);
    return null;
  }
  return stream;
};


WebcamApp.prototype.detectVideo = async function () {
  if (!this.video || this.video.paused) {
    return false;
  }

  const t0 = performance.now();

  faceapi
    .detectSingleFace(this.video, this.options.optionsSSDMobileNet)
    .withFaceExpressions()
    .then((result) => {

      // self restart
      let cooldown = this.options.refreshTime;
      let t1 = performance.now();
      if ((t1 - t0) > this.options.refreshTime) {
        cooldown = 0;
      }

      if (!result) {
        return util.delay(cooldown).then(() => {
          return this.detectVideo();
        });
      }

      let currentExpression = this.getTopEmotion(result);
      let currentExpressionStr = currentExpression[0];
      let currentExpressionConf = currentExpression[1];
      let faceBoxString = 'Expression: ' + currentExpressionStr + ' ' + Math.floor(currentExpressionConf * 100).toString() + '%';

      util.drawFace(this.canvas, result, faceBoxString);

      this.currentExpressionDetectionCount += 1;

      if (this.previousExpression != currentExpressionStr) {
        this.previousExpression = currentExpressionStr;
        this.currentExpressionDetectionCount = 1;
        document.dispatchEvent(this.expressionChangedEvent);
      }

      document.dispatchEvent(this.expressionDetectedEvent);

      return util.delay(cooldown).then(() => {
        return this.detectVideo();
      });
      //requestAnimationFrame(() => detectVideo(video, canvas));
      //return true;
    })
    .catch((err) => {
      //util.log(`Detect Error:`);
      /*util.log(err);
      console.log(err);*/
      // attempt to restart
      this.detectVideo();
      return false;
    });
  return false;
};


WebcamApp.prototype.getTopEmotion = function (result) {
  return Object.entries(result.expressions).sort((a, b) => b[1] - a[1])[0];
};


WebcamApp.prototype._setupVideoPauseOnClick = function () {
  this.canvas.addEventListener('click', () => {
    if (this.video.paused) {
      this.resume();
    } else {
      this.pause();
    }
    util.log(`Camera state: ${this.video.paused ? "paused" : "playing"}`);
  });
};
