const { Canvas, createCanvas, Image, ImageData, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { writeFileSync, existsSync, mkdirSync } = require("fs");
const faceapi = require('@vladmandic/face-api');
const cv = require('@techstark/opencv-js');

const minConfidence = 0.5;
/*
const faceDetectionNet = faceapi.nets.ssdMobilenetv1;
const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({minConfidence});
*/
const faceDetectionNet = faceapi.nets.tinyFaceDetector;
const faceDetectionOptions = new faceapi.TinyFaceDetectorOptions({minConfidence});

let globalFrame = null;
let lastFrame = null;

function main() {
  installDOM();
  let camera = new cv.VideoCapture(0);
  ret, frame = camera.read();
}

function installDOM(){
  const dom = new JSDOM();
  global.document = dom.window.document;
  global.Image = Image;
  global.HTMLCanvasElement = Canvas;
  global.ImageData = ImageData;
  global.HTMLImageElement = Image;
}

function openCvReady() {
  main();
}

setTimeout(() => {
    openCvReady()
}, 1000);
